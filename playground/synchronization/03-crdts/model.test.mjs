import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from './model.mjs';
import {permutations} from '../01-math-conflicts/model.mjs';
const setKey=s=>[...s].sort();
function joinLaws(states,join,canonical) {
  for(const a of states)for(const b of states)for(const c of states){
    assert.deepEqual(canonical(join(a,a)),canonical(a));
    assert.deepEqual(canonical(join(a,b)),canonical(join(b,a)));
    assert.deepEqual(canonical(join(join(a,b),c)),canonical(join(a,join(b,c))));
  }
}
const canonical2=s=>({adds:setKey(s.adds),removed:setKey(s.removed)});
const canonicalPN=s=>({p:C.sortedMap(s.p),n:C.sortedMap(s.n)});
test('G-set converges across all three-branch orders, duplicates and join laws',()=>{
  const states=[new Set(),C.gAdd(new Set(),'M'),C.gAdd(new Set(),'D')];
  joinLaws(states,C.union,setKey);
  for(const order of permutations(states)) assert.deepEqual(setKey([...order,...order].reduce(C.union,new Set())),['D','M']);
});
test('2P-set cannot re-add a permanently removed element',()=>{
  const before=C.twoPAdd(C.empty2P(),'urgent'),after=C.twoPRemove(before,'urgent');
  assert.deepEqual(C.twoPValues(C.merge2P(after,before)),[]);
  assert.throws(()=>C.twoPAdd(after,'urgent'),/re-add/);
  joinLaws([C.empty2P(),before,after],C.merge2P,canonical2);
});
test('G-counter joins cumulative components instead of summing duplicate totals',()=>{
  const a=C.gInc(C.emptyG(),'M',2n),b=C.gInc(C.emptyG(),'D',3n);
  assert.equal(C.gValue(C.mergeG(a,b)),5n);
  assert.equal(C.gValue(C.mergeG(C.mergeG(a,b),a)),5n);
  joinLaws([C.emptyG(),a,b,C.gInc(a,'M')],C.mergeG,C.sortedMap);
});
test('G-counter negative delta rejected and bigints avoid floating-point overflow',()=>{
  assert.throws(()=>C.gInc(C.emptyG(),'M',-1n),/positive/);
  const large=9007199254740993n;
  assert.equal(C.gValue(C.gInc(C.emptyG(),'M',large)),large);
});
test('two unsynchronized copies of the same counter writer lose a branch increment',()=>{
  const a=C.gInc(C.emptyG(),'M'),b=C.gInc(C.emptyG(),'M');
  assert.equal(C.gValue(C.mergeG(a,b)),1n); // Violated exclusive-writer assumption.
});
test('PN-counter converges but does not preserve nonnegative inventory',()=>{
  const base=C.pnInc(C.emptyPN(),'S');
  const a=C.pnDec(base,'M'),b=C.pnDec(base,'D');
  assert.equal(C.pnValue(a),0n);assert.equal(C.pnValue(b),0n);
  assert.equal(C.pnValue(C.mergePN(a,b)),-1n);
  joinLaws([C.emptyPN(),base,a,b],C.mergePN,canonicalPN);
});
test('OR-set joins reordered snapshots and suppresses duplicate add IDs',()=>{
  const base=C.addTag(C.emptyOR(),'S:1','urgent');
  const a=C.removeObserved(base,'urgent'),b=C.addTag(base,'D:1','urgent');
  joinLaws([C.emptyOR(),base,a,b],C.mergeOR,C.canonicalOR);
  for(const order of permutations([base,a,b]))assert.deepEqual(C.tags([...order,...order].reduce(C.mergeOR,C.emptyOR())),['urgent']);
});
test('discarding OR tombstones permits stale resurrection',()=>{
  const old=C.addTag(C.emptyOR(),'S:1','urgent'),gone=C.removeObserved(old,'urgent');
  assert.deepEqual(C.tags(C.mergeOR(gone,old)),[]);
  assert.deepEqual(C.tags(C.mergeOR(C.emptyOR(),old)),['urgent']);
});
test('LWW max converges while selecting just one scalar value',()=>{
  const a={stamp:1,actor:'M',id:'M:1',value:'Plan'},b={stamp:1,actor:'D',id:'D:1',value:'Proposal'};
  joinLaws([a,b,{stamp:2,actor:'M',id:'M:2',value:'Final'}],C.lww,x=>x);
  assert.equal(C.lww(a,b).value,'Plan');
});
test('MV context keeps concurrent values and suppresses stale snapshots after resolution',()=>{
  const a=C.mvAssign(C.emptyMV(),'M','Plan'),b=C.mvAssign(C.emptyMV(),'D','Proposal');
  const both=C.mergeMV(a,b),resolved=C.mvAssign(both,'M','Project plan');
  assert.deepEqual(C.mvValues(both).sort(),['Plan','Proposal']);
  assert.deepEqual(C.mvValues(C.mergeMV(resolved,a)),['Project plan']);
  assert.deepEqual(C.mvValues(C.mergeMV(resolved,b)),['Project plan']);
  assert.equal(resolved.entries.size,1);assert.equal(resolved.context.size,2);
  joinLaws([C.emptyMV(),a,b,both,resolved],C.mergeMV,C.canonicalMV);
});
test('MV different payload on same dot rejected rather than arbitrarily selected',()=>{
  const a=C.mvAssign(C.emptyMV(),'M','Plan'),b=C.mvAssign(C.emptyMV(),'M','Proposal');
  assert.throws(()=>C.mergeMV(a,b),/reused/);
});
test('MV candidates arriving in every snapshot order cannot resurrect resolved values',()=>{
  const a=C.mvAssign(C.emptyMV(),'M','Plan'),b=C.mvAssign(C.emptyMV(),'D','Proposal');
  const resolved=C.mvAssign(C.mergeMV(a,b),'M','Project plan');
  for(const order of permutations([a,b,resolved])) {
    const final=[...order,...order].reduce(C.mergeMV,C.emptyMV());
    assert.deepEqual(C.mvValues(final),['Project plan']);
  }
});
test('fixed-key map merges distinct keys and retains deletion evidence',()=>{
  const base=C.mapWrite(new Map(),'title',{stamp:1,actor:'S',id:'S:1',value:'Draft'});
  const a=C.mapWrite(base,'title',{stamp:2,actor:'M',id:'M:1',value:null},true);
  const b=C.mapWrite(base,'status',{stamp:2,actor:'D',id:'D:1',value:'open'});
  assert.deepEqual(C.mapValues(C.mergeMap(a,b)),{status:'open'});
  joinLaws([new Map(),base,a,b],C.mergeMap,C.sortedMap);
});
test('map cell identity cannot switch live/deleted meaning at an equal key',()=>{
  const entry={stamp:1,actor:'M',id:'M:1',value:null};
  assert.throws(()=>C.mergeMap(C.mapWrite(new Map(),'x',entry),C.mapWrite(new Map(),'x',entry,true)),/reused/);
});
test('sequence merges concurrent insertions into stable distinct gaps',()=>{
  const base=C.seedText('cat');
  const a=C.seqInsert(base,'M','S:1','X').state,b=C.seqInsert(base,'D','S:2','Y').state;
  assert.equal(C.seqView(C.mergeSeq(a,b)).text,'cXaYt');
  joinLaws([C.emptySeq(),base,a,b],C.mergeSeq,C.canonicalSeq);
});
test('concurrent same-anchor runs stay deterministic in this depth-first policy',()=>{
  const base=C.seedText('z');
  const m1=C.seqInsert(base,'M','S:1','X'),m2=C.seqInsert(m1.state,'M',m1.node.id,'x');
  const d1=C.seqInsert(base,'D','S:1','Y'),d2=C.seqInsert(d1.state,'D',d1.node.id,'y');
  assert.equal(C.seqView(C.mergeSeq(m2.state,d2.state)).text,'zXxYy');
});
test('child-before-parent and deletion-before-insertion buffer evidence then settle',()=>{
  const parent={id:'M:1',actor:'M',clock:1,after:null,text:'a'};
  const child={id:'M:2',actor:'M',clock:2,after:'M:1',text:'b'};
  for(const order of permutations([parent,child])) {
    let s=C.seqDelete(C.emptySeq(),['M:1']);
    for(const n of [...order,...order])s=C.receiveNode(s,n);
    assert.equal(C.seqView(s).text,'b'); assert.deepEqual(C.seqView(s).unresolved,[]);
  }
  const pending=C.receiveNode(C.emptySeq(),child);
  assert.equal(C.seqView(pending).text,'');assert.deepEqual(C.seqView(pending).unresolved,['M:2']);
});
test('deleting an anchor preserves traversal to live descendants',()=>{
  const base=C.seedText('cat'),a=C.seqInsert(base,'M','S:1','X').state;
  const gone=C.seqDelete(a,['S:1']);assert.equal(C.seqView(gone).text,'Xat');
  const broken={nodes:new Map(gone.nodes),removed:new Set(gone.removed)};broken.nodes.delete('S:1');
  assert.equal(C.seqView(broken).text,'');assert.equal(C.seqView(broken).unresolved.length,3);
});
test('sequence rejects identity changes and impossible anchor order',()=>{
  const base=C.seedText('a');
  assert.throws(()=>C.receiveNode(base,{...base.nodes.get('S:1'),text:'b'}),/reused/);
  assert.throws(()=>C.receiveNode(base,{id:'M:1',actor:'M',clock:1,after:'S:1',text:'b'}),/precede/);
  assert.throws(()=>C.seqInsert(base,'M','missing','b'),/known anchor/);
  assert.throws(()=>C.seqDelete(base,[undefined]),/deletion IDs/);
});
test('sequence atom is a Unicode scalar, not a grapheme or UTF-16 code unit',()=>{
  const emoji=C.seqInsert(C.emptySeq(),'M',null,'😀').state;
  assert.equal(C.seqView(emoji).text,'😀');assert.equal(C.seqView(emoji).ids.length,1);
  assert.throws(()=>C.seqInsert(C.emptySeq(),'M',null,'\ud800'),/surrogate/);
  assert.throws(()=>C.seqInsert(C.emptySeq(),'M',null,'e\u0301'),/scalar/);
  assert.equal(C.seqView(C.seedText('e\u0301')).ids.length,2);
});
test('rich text explicit observed marks do not inherit onto unseen concurrent insertion',()=>{
  const base=C.seedText('cat'),rich=C.emptyRich(base);
  assert.throws(()=>C.markIds(rich,['S:2'],undefined,true,{stamp:1,actor:'M',id:'M:1'}),/Invalid mark/);
  const a=C.markIds(rich,['S:2'],'bold',true,{stamp:1,actor:'M',id:'M:1'});
  const b={...rich,sequence:C.seqInsert(base,'D','S:2','Y').state};
  const ab=C.mergeRich(a,b),ba=C.mergeRich(b,a);
  assert.deepEqual(C.richView(ab),C.richView(ba));
  assert.equal(C.richView(ab).map(x=>x.text).join(''),'caYt');
  assert.deepEqual(C.richView(ab).find(x=>x.text==='a').marks,{bold:true});
  assert.deepEqual(C.richView(ab).find(x=>x.text==='Y').marks,{});
});
test('rich text retains formatting evidence but hides deleted elements',()=>{
  const base=C.seedText('cat'),rich=C.emptyRich(base);
  const marked=C.markIds(rich,['S:2'],'bold',true,{stamp:1,actor:'M',id:'M:1'});
  const deleted={...rich,sequence:C.seqDelete(base,['S:2'])};
  const merged=C.mergeRich(marked,deleted);
  assert.equal(C.richView(merged).map(x=>x.text).join(''),'ct');assert.equal(merged.format.size,1);
});
test('rich text product joins obey laws on compatible sequence and mark fixtures',()=>{
  const rich=C.emptyRich(C.seedText('a'));
  const yes=C.markIds(rich,['S:1'],'bold',true,{stamp:1,actor:'M',id:'M:1'});
  const no=C.markIds(rich,['S:1'],'bold',false,{stamp:2,actor:'D',id:'D:1'});
  joinLaws([rich,yes,no],C.mergeRich,s=>({sequence:C.canonicalSeq(s.sequence),format:C.sortedMap(s.format)}));
});
