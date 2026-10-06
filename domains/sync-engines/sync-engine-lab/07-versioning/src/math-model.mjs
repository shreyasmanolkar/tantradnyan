import assert from 'node:assert/strict';
import {relation,vectorMerge} from '../../shared/clocks.mjs';
export function topological(events) {
  const done=new Set(),out=[];
  while(out.length<events.length) {
    const next=events.find(e=>!done.has(e.id)&&e.dependencies.every(d=>done.has(d)));
    if(!next)throw Error('cycle or missing dependency');done.add(next.id);out.push(next.id);
  }
  return out;
}
export function run() {
  const graph=[{id:'reply',dependencies:['message']},{id:'message',dependencies:[]},{id:'other',dependencies:[]}];
  const order=topological(graph);assert.ok(order.indexOf('message')<order.indexOf('reply'));
  assert.throws(()=>topological([{id:'x',dependencies:['x']}]),/cycle/);
  const setJoin=(a,b)=>[...new Set([...a,...b])].sort();
  assert.deepEqual(setJoin(['a'],['b']),setJoin(['b'],['a']));
  assert.equal(relation({A:1},{B:1}),'concurrent');
  assert.notEqual('a'+'b','b'+'a');
  return {order,vectorJoin:vectorMerge({A:1},{B:1}),monoidCounterexample:['ab','ba'],allThreeAttemptsLost:0.1**3,meanAttempts:1/0.9,requestReplySuccess:0.9**2,minBitsForEightStates:Math.log2(8)};
}
if(process.argv[1]?.endsWith('/math-model.mjs'))console.log(run());
