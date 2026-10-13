import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import assert from 'node:assert/strict';import {Scheduler,Random} from './scheduler.mjs';import {Authority} from '../c-offline-engine/authority.mjs';import {OfflineClient} from '../c-offline-engine/client.mjs';
export async function runScenario(seed,{operationsPerActor=8}={}){
 if(!Number.isInteger(operationsPerActor)||operationsPerActor<1||operationsPerActor>30)throw new Error('BAD_WORKLOAD');
 const dir=await mkdtemp(join(tmpdir(),'sync-fault-seed-'));let authority;const clients=[];
 try{
  authority=new Authority(join(dir,'authority.sqlite'));for(const actor of ['M','D']){const c=new OfflineClient(join(dir,actor+'.sqlite'),actor);const q=c.pullRequest();c.install(authority.pull(actor,q),q);clients.push(c);}
  const scheduler=new Scheduler({seed}),random=new Random(seed),original=[],accepted=new Map();scheduler.journal.append({type:'begin',seed,operationsPerActor});
  for(const c of clients)for(let i=0;i<operationsPerActor;i++){const delta=1+random.integer(3);c.enqueue('increment',delta);const op=c.pending().at(-1).operation;original.push({actor:c.actor,op,label:c.actor+':'+i});}
  for(let at=0;at<20;at++){
   scheduler.advance(at);
   for(const actor of ['M','D']){
    const choice=original.filter(x=>x.actor===actor)[random.integer(operationsPerActor)];
    scheduler.send(choice.label,choice,entry=>{
     const outcome=authority.submit(entry.actor,entry.op);accepted.set(entry.label,outcome.seq);
     scheduler.send('ack:'+entry.label,{actor:entry.actor,id:entry.op.opId,outcome},ack=>{const c=clients.find(x=>x.actor===ack.actor);if(c.pending().some(x=>x.operation.opId===ack.id))c.recordOutcome(ack.outcome,ack.id);});
    });
   }
  }
  scheduler.drain();
  // Restore delivery: retry EVERY original operation under its unchanged identity.
  for(const entry of original){const outcome=authority.submit(entry.actor,entry.op);accepted.set(entry.label,outcome.seq);const c=clients.find(x=>x.actor===entry.actor);if(c.pending().some(x=>x.operation.opId===entry.op.opId))c.recordOutcome(outcome,entry.op.opId);}
  authority.prune();
  for(const c of clients){for(let page=0;page<20;page++){const request=c.pullRequest(),response=authority.pull(c.actor,request);c.install(response,request);if(!response.more)break;}assert.equal(c.pending().length,0);assert.deepEqual(c.confirmed(),authority.current());assert.equal(c.view().count,c.confirmed().count);assert.equal(c.meta().cursor,authority.meta().head);}
  const expected=original.reduce((n,x)=>n+x.op.payload.delta,0),stats=authority.stats();assert.equal(stats.record.count,expected);assert.equal(stats.outcomes,original.length);assert.equal(stats.meta.head,original.length);assert.equal(stats.record.version,original.length);assert.equal(accepted.size,original.length);
  const result={seed,operations:original.length,count:expected,head:stats.meta.head,network:scheduler.stats};scheduler.journal.append({type:'verified',...result});return {result,trace:scheduler.journal.entries(),anchor:scheduler.journal.anchor()};
 }finally{for(const c of clients)c.close();authority?.close();await rm(dir,{recursive:true,force:true});}
}
