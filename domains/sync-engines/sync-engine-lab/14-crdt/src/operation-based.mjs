import assert from 'node:assert/strict';
// Commuting increment effects plus ID dedup, independent of causal delivery.
export class CounterReplica {
  constructor() {this.count=0;this.receipts={};}
  effect(op) {
    if(Object.hasOwn(this.receipts,op.id)) {
      if(this.receipts[op.id]!==op.amount)throw Error('ID payload collision');return;
    }
    if(!Number.isSafeInteger(op.amount))throw Error('integer amount');
    this.receipts[op.id]=op.amount;this.count+=op.amount;
  }
}
export function run() {
  const a=new CounterReplica(),b=new CounterReplica(),ops=[{id:'A:1',amount:2},{id:'B:1',amount:3},{id:'A:2',amount:-1}];
  for(const op of [...ops,ops[0]])a.effect(op);
  for(const op of [ops[2],ops[1],ops[1],ops[0]])b.effect(op);
  assert.equal(a.count,4);assert.equal(a.count,b.count);assert.throws(()=>a.effect({id:'A:1',amount:8}),/collision/);
  return {a,b,assumption:'All effects eventually delivered; dedup metadata grows and must be persisted with effect for recovery.'};
}
if(process.argv[1]?.endsWith('/operation-based.mjs'))console.log(run());
