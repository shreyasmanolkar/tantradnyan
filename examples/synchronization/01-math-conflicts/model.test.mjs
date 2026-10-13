import test from 'node:test';
import assert from 'node:assert/strict';
import { allArrive, retryModel, occupancy, clockBound, lww, threeWay, addWrite,
  mergeWrites, frontier, emptyOR, addTag, applyRemoval, removeObserved, mergeOR,
  tags, canonicalOR, permutations } from './model.mjs';
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-12, `${a} != ${b}`);
const entries = x => Object.entries(x).sort(([a],[b])=>a<b?-1:a>b?1:0);
const candidates=[
  {stamp:10,actor:'M',id:'M:1',value:'Plan'},
  {stamp:10,actor:'D',id:'D:1',value:'Proposal'},
  {stamp:11,actor:'D',id:'D:2',value:'Final'},
];
const m={id:'M:1',vector:[1,0],value:'Plan'};
const d={id:'D:1',vector:[0,1],value:'Proposal'};
const resolved={id:'M:2',vector:[2,1],value:'Project plan'};

test('loss calculation distinguishes empty transfer and required packets',()=>{
  near(1-allArrive(0.01,100),0.6339676587267709);
  assert.equal(allArrive(1,0),1);
  assert.equal(allArrive(1,2),0);
  assert.throws(()=>allArrive(-0.1,2),/Invalid/);
});
test('retry acknowledgment model includes request and ack loss',()=>{
  const r=retryModel(0.05,0.05,3);
  near(r.q,0.0975); near(r.expectedUnlimited,1/0.9025);
  near(r.unacknowledged,0.0975**3);
  near(r.expectedCapped,1+0.0975+0.0975**2);
});
test('permanent loss means no unlimited completion guarantee',()=>{
  const r=retryModel(1,0,3);
  assert.equal(r.expectedUnlimited,Infinity);
  assert.equal(r.unacknowledged,1); assert.equal(r.expectedCapped,3);
});
test('units produce occupancy and drift bounds',()=>{
  assert.equal(occupancy(2000,0.075),150);
  near(clockBound(0.005,0.00002,3600),0.077);
  assert.throws(()=>clockBound(0,-1,1),/Invalid/);
});
test('LWW selects the same maximum across every three-candidate order and duplicates',()=>{
  for(const order of permutations(candidates)){
    const winner=order.reduce(lww);
    assert.deepEqual(winner,candidates[2]);
    assert.deepEqual(lww(winner,winner),winner);
  }
});
test('LWW obeys grouping and branch symmetry on bounded candidate fixture',()=>{
  for(const a of candidates) for(const b of candidates) for(const c of candidates){
    assert.deepEqual(lww(a,b),lww(b,a));
    assert.deepEqual(lww(lww(a,b),c),lww(a,lww(b,c)));
  }
});
test('skewed timestamp selects the earlier edit despite deterministic convergence',()=>{
  assert.equal(lww({stamp:6,actor:'M',id:'M:1',value:'earlier'},
    {stamp:2,actor:'D',id:'D:1',value:'later'}).value,'earlier');
});
test('equal ordering keys cannot have different contents',()=>{
  assert.throws(()=>lww(candidates[0],{...candidates[0],value:'forged'}),/different payload/);
});
test('three-way merge preserves one-sided fields and agrees under branch swap',()=>{
  const base={title:'Draft',status:'open'};
  const a={title:'Plan',status:'open'}, b={title:'Draft',status:'closed'};
  const ab=threeWay(base,a,b),ba=threeWay(base,b,a);
  assert.deepEqual(entries(ab.merged),[['status','closed'],['title','Plan']]);
  assert.deepEqual(entries(ab.merged),entries(ba.merged)); assert.deepEqual(ab.conflicts,[]);
});
test('different concurrent title values remain explicit conflicts',()=>{
  const result=threeWay({title:'Draft'},{title:'Plan'},{title:'Proposal'});
  assert.equal(Object.hasOwn(result.merged,'title'),false);
  assert.deepEqual(result.conflicts,[{key:'title',base:{present:true,value:'Draft'},
    local:{present:true,value:'Plan'},remote:{present:true,value:'Proposal'}}]);
});
test('absence is deletion, while null is a distinct value',()=>{
  const deletion=threeWay({title:'Draft'},{},{title:'Draft'});
  assert.equal(Object.hasOwn(deletion.merged,'title'),false);
  assert.equal(deletion.conflicts.length,0);
  const competing=threeWay({title:'Draft'},{},{title:null});
  assert.equal(competing.conflicts.length,1);
  assert.deepEqual(competing.conflicts[0].local,{present:false});
  assert.deepEqual(competing.conflicts[0].remote,{present:true,value:null});
});
test('clean field merge can violate the schedule invariant',()=>{
  const r=threeWay({start:10,end:20},{start:18,end:20},{start:10,end:12});
  assert.equal(r.conflicts.length,0);
  assert.equal(r.merged.start<=r.merged.end,false);
});
test('flat merge rejects nested data and treats prototype-like keys as inert',()=>{
  assert.throws(()=>threeWay({x:{}},{x:{}},{x:{}}),/scalar/);
  const r=threeWay({},JSON.parse('{"__proto__":"data"}'),{});
  assert.equal(Object.getPrototypeOf(r.merged),null);
  assert.equal(r.merged.__proto__,'data');
});
test('causal frontier retains independent candidates then supersedes both',()=>{
  const a=addWrite(new Map(),m), b=addWrite(new Map(),d);
  const both=mergeWrites(a,b);
  assert.deepEqual(frontier(both).map(x=>x.id),['D:1','M:1']);
  const done=addWrite(both,resolved);
  assert.deepEqual(frontier(done).map(x=>x.value),['Project plan']);
  assert.equal(done.size,3); // Retained causal/audit history is intentional.
});
test('causal projection withstands every delayed, reordered, duplicated write schedule',()=>{
  for(const order of permutations([m,d,resolved])){
    let state=new Map();
    for(const write of [...order,...order]) state=addWrite(state,write);
    assert.deepEqual(frontier(state).map(x=>x.id),['M:2']);
    assert.equal(state.size,3);
  }
});
test('write identity reuse cannot forge a new payload or causal context',()=>{
  const state=addWrite(new Map(),m);
  assert.throws(()=>addWrite(state,{...m,value:'fake'}),/reused/);
  assert.throws(()=>addWrite(state,{...m,vector:[2,0]}),/reused/);
  assert.throws(()=>addWrite(state,{...d,vector:[1]}),/equal nonempty/);
});
test('observed removal preserves an unseen concurrent add in either merge order',()=>{
  const base=addTag(emptyOR(),'S:1','urgent');
  const a=removeObserved(base,'urgent'), b=addTag(base,'D:1','urgent');
  assert.deepEqual(tags(mergeOR(a,b)),['urgent']);
  assert.deepEqual(canonicalOR(mergeOR(a,b)),canonicalOR(mergeOR(b,a)));
  assert.deepEqual(tags(removeObserved(mergeOR(a,b),'urgent')),[]);
});
test('a delayed removed addition does not resurrect membership',()=>{
  const earlyRemove=applyRemoval(emptyOR(),['S:1']);
  assert.deepEqual(tags(addTag(earlyRemove,'S:1','urgent')),[]);
  const old=addTag(emptyOR(),'S:1','urgent');
  assert.deepEqual(tags(mergeOR(earlyRemove,old)),[]);
});
test('observed-remove evidence obeys join laws including duplicates and delayed tombstones',()=>{
  const states=[emptyOR(),addTag(emptyOR(),'S:1','urgent'),
    applyRemoval(emptyOR(),['S:1']),addTag(emptyOR(),'D:1','urgent')];
  for(const a of states) for(const b of states) for(const c of states){
    assert.deepEqual(canonicalOR(mergeOR(a,a)),canonicalOR(a));
    assert.deepEqual(canonicalOR(mergeOR(a,b)),canonicalOR(mergeOR(b,a)));
    assert.deepEqual(canonicalOR(mergeOR(mergeOR(a,b),c)),canonicalOR(mergeOR(a,mergeOR(b,c))));
  }
});
test('addition identity cannot be reassigned to another tag',()=>{
  const a=addTag(emptyOR(),'S:1','urgent'),b=addTag(emptyOR(),'S:1','review');
  assert.throws(()=>mergeOR(a,b),/different tag/);
  assert.deepEqual(tags(a),['urgent']);
});
