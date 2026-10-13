import { allArrive, retryModel, occupancy, clockBound, lww, threeWay,
  addWrite, mergeWrites, frontier, emptyOR, addTag, removeObserved, mergeOR, tags } from './model.mjs';

console.log(`100 packets, 1% loss: ${((1-allArrive(0.01,100))*100).toFixed(3)}% chance of a loss`);
console.log(`5% request/ack loss: ${retryModel(0.05,0.05,3).expectedUnlimited.toFixed(3)} mean attempts`);
console.log(`2000/s at 75ms: ${occupancy(2000,0.075)} operations in flight on average`);
console.log(`20ppm after one hour plus 5ms: ${(clockBound(0.005,0.00002,3600)*1000).toFixed(0)}ms uncertainty`);
console.log(`LWW: ${lww({stamp:6,actor:'M',id:'M:1',value:'earlier'},
  {stamp:2,actor:'D',id:'D:1',value:'later'}).value} wins under a skewed clock`);
const base={title:'Draft',start:10,end:20};
const merged=threeWay(base,{title:'Draft',start:18,end:20},{title:'Draft',start:10,end:12});
console.log(`clean field merge: [${merged.merged.start},${merged.merged.end}], valid=${merged.merged.start<=merged.merged.end}`);
const mira=addWrite(new Map(),{id:'M:1',vector:[1,0],value:'Plan'});
const dev=addWrite(new Map(),{id:'D:1',vector:[0,1],value:'Proposal'});
console.log(`causal title alternatives: ${frontier(mergeWrites(mira,dev)).map(x=>x.value).sort().join(', ')}`);
const initial=addTag(emptyOR(),'S:1','urgent');
console.log(`remove vs unseen add: ${tags(mergeOR(removeObserved(initial,'urgent'),addTag(initial,'D:1','urgent'))).join(', ')}`);
