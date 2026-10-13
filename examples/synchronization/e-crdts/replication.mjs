import assert from 'node:assert/strict';
import * as C from '../03-crdts/model.mjs';
import {Scheduler} from '../g-fault-harness/scheduler.mjs';

// Construct only compatible states: each actor has one branch/writer.
export function fixtures() {
 const g=[C.gInc(C.emptyG(),'M',2n),C.gInc(C.emptyG(),'D',3n),C.gInc(C.emptyG(),'S',4n)];
 const tag=C.addTag(C.emptyOR(),'S:1','urgent');
 const seq=C.seedText('cat');
 const x=C.seqInsert(seq,'M','S:1','X').state;
 const y=C.seqInsert(seq,'D','S:2','Y').state;
 return [
  {name:'counter',states:g,join:C.mergeG,canonical:C.sortedMap,view:s=>C.gValue(s).toString()},
  {name:'tags',states:[C.removeObserved(tag,'urgent'),C.addTag(tag,'D:1','urgent'),tag],join:C.mergeOR,canonical:C.canonicalOR,view:C.tags},
  {name:'title',states:[C.mvAssign(C.emptyMV(),'M','Plan'),C.mvAssign(C.emptyMV(),'D','Proposal'),C.emptyMV()],join:C.mergeMV,canonical:C.canonicalMV,view:C.mvValues},
  {name:'sequence',states:[x,y,C.seqDelete(seq,['S:1'])],join:C.mergeSeq,canonical:C.canonicalSeq,view:s=>C.seqView(s).text}
 ];
}

export function replicate(fixture,seed,{loss=0.35,duplicate=0.6,repair=true}={}) {
 const states=fixture.states.map(s=>structuredClone(s));
 const expected=fixture.states.reduce(fixture.join);
 const scheduler=new Scheduler({seed,loss,duplicate,maxDelay:8});
 // Payload is complete state, not a command to increment/remove again.
 for(let round=0;round<3;round++) {
  for(let from=0;from<states.length;from++)for(let to=0;to<states.length;to++) {
   if(from===to)continue;
   scheduler.send(`${fixture.name}:${round}:${from}>${to}`,states[from],incoming=>{
    states[to]=fixture.join(states[to],incoming);
   });
  }
  scheduler.advance(scheduler.now+1);
 }
 scheduler.drain();
 const before=states.map(fixture.view);
 // Network recovery is an explicit assumption. This finite reliable round
 // uses snapshots captured AFTER all faulted deliveries completed.
 if(repair) {
  const finalSnapshots=states.map(s=>structuredClone(s));
  for(let to=0;to<states.length;to++)for(const incoming of finalSnapshots)
   states[to]=fixture.join(states[to],incoming);
  for(const state of states)assert.deepEqual(fixture.canonical(state),fixture.canonical(expected));
 }
 return {name:fixture.name,seed,before,after:states.map(fixture.view),
  expected:fixture.view(expected),stats:{...scheduler.stats},trace:scheduler.journal.entries()};
}
