import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {runScenario} from './scenario.mjs';import {Scheduler} from './scheduler.mjs';import {Journal,scopeKey} from './journal.mjs';import {startProxy} from './proxy.mjs';import {authorityProcess,crashedClient} from './supervisor.mjs';
import {startServer} from '../c-offline-engine/server.mjs';import {OfflineClient,HttpTransport} from '../c-offline-engine/client.mjs';import {Authority} from '../c-offline-engine/authority.mjs';
import {emptyG,gInc,mergeG,gValue,emptyOR,addTag,removeObserved,mergeOR,tags} from '../03-crdts/model.mjs';
async function fixture(t){const dir=await mkdtemp(join(tmpdir(),'sync-g-test-')),service=await startServer(join(dir,'server.sqlite')),m=new OfflineClient(join(dir,'M.sqlite'),'M'),d=new OfflineClient(join(dir,'D.sqlite'),'D');t.after(async()=>{m.close();d.close();await service.close();await rm(dir,{recursive:true,force:true});});await m.synchronize(service.url);await d.synchronize(service.url);return {dir,service,m,d};}
test('seeded file-backed scenarios reproduce traces and verify original-operation oracle',async()=>{
 for(const seed of [1,2,7,42,99]){const a=await runScenario(seed),b=await runScenario(seed);assert.deepEqual(a.result,b.result);assert.deepEqual(a.trace,b.trace);assert.equal(a.result.head,16);assert.ok(a.result.network.dropped>0);assert.ok(a.result.network.duplicates>0);assert.equal(Journal.verify(a.trace,a.anchor),true);}
});
test('generic scheduler supports complete loss and an explicit bounded queue',()=>{
 const loss=new Scheduler({seed:1,loss:1});let invoked=false;loss.send('x',{value:1},()=>invoked=true);loss.drain();assert.equal(invoked,false);assert.equal(loss.stats.dropped,1);
 const bounded=new Scheduler({seed:1,loss:0,duplicate:0,maxQueued:1});bounded.send('first',{},()=>{});assert.throws(()=>bounded.send('second',{},()=>{}),/SCHEDULER_QUEUE_FULL/);
});
test('state-based CRDT adapters converge after adverse delivery and anti-entropy repair',()=>{
 const a=gInc(emptyG(),'M',2n),b=gInc(emptyG(),'D',3n),link=new Scheduler({seed:7,loss:0.4,duplicate:0.7,maxDelay:4});let left=a,right=b;
 for(let i=0;i<10;i++){link.send('M-state',a,s=>right=mergeG(right,s));link.send('D-state',b,s=>left=mergeG(left,s));}link.drain();left=mergeG(left,b);right=mergeG(right,a);assert.equal(gValue(left),5n);assert.equal(gValue(right),5n);
});
test('OR-set deletion evidence prevents stale resurrection; deliberate bad GC is detected',()=>{
 const old=addTag(emptyOR(),'M:1','urgent'),removed=removeObserved(old,'urgent');assert.deepEqual(tags(mergeOR(removed,old)),[]);
 const unsafe=mergeOR(emptyOR(),old);assert.throws(()=>assert.deepEqual(tags(unsafe),[]));
});
test('tuple namespaces prevent separator collisions but are not authorization',()=>{
 assert.equal(['t:a','d'].join(':'),['t','a:d'].join(':'));assert.notEqual(scopeKey('t:a','d'),scopeKey('t','a:d'));assert.notEqual(scopeKey('tenant1','doc','M'),scopeKey('tenant2','doc','M'));assert.throws(()=>scopeKey(''),/BAD_SCOPE/);
});
test('trace chain detects edits and anchored truncation; unanchored valid prefix is allowed',()=>{
 const j=new Journal();j.append({op:'M:1',status:'accepted'});j.append({op:'D:1',status:'conflict'});const rows=j.entries(),anchor=j.anchor();assert.equal(Journal.verify(rows,anchor),true);rows[0].event.status='rejected';assert.equal(Journal.verify(rows,anchor),false);
 const prefix=j.entries().slice(0,1);assert.equal(Journal.verify(prefix),true);assert.equal(Journal.verify(prefix,anchor),false);
});
test('HTTP lost response after commit retries identical operation without repeated effect',async t=>{
 const {service,m}=await fixture(t),proxy=await startProxy(service.url,{plan:[{path:'/submit',mode:'drop-after'}]});t.after(proxy.close);m.enqueue('increment',2);const op=m.pending()[0].operation,transport=new HttpTransport(proxy.url,'M',{delayMs:0});const result=await transport.call('/submit',op);assert.equal(result.status,'accepted');assert.equal(service.authority.current().count,2);assert.equal(service.authority.stats().outcomes,1);assert.equal(proxy.stats.droppedAfter,1);assert.equal(proxy.stats.forwards,2);await m.synchronize(proxy.url);assert.equal(m.view().count,2);assert.equal(m.pending().length,0);
});
test('HTTP duplicate forward commits once and returns stable result',async t=>{
 const {service,m}=await fixture(t),proxy=await startProxy(service.url,{plan:[{path:'/submit',mode:'duplicate'}]});t.after(proxy.close);m.enqueue('increment',3);const op=m.pending()[0].operation;await new HttpTransport(proxy.url,'M',{attempts:1}).call('/submit',op);assert.equal(proxy.stats.duplicates,1);assert.equal(service.authority.current().count,3);assert.equal(service.authority.stats().outcomes,1);
});
test('HTTP partition preserves durable pending work and heals through original IDs',async t=>{
 const {service,m}=await fixture(t),proxy=await startProxy(service.url);t.after(proxy.close);m.enqueue('increment',2);const id=m.pending()[0].operation.opId;proxy.partition(true);await assert.rejects(m.synchronize(proxy.url));assert.equal(m.pending()[0].operation.opId,id);assert.equal(service.authority.current().count,0);assert.equal(proxy.stats.forwards,0);proxy.partition(false);await m.synchronize(proxy.url);assert.equal(m.confirmed().count,2);assert.equal(m.pending().length,0);
});
test('real HTTP delayed response is stale after a newer projection commits',async t=>{
 const {service,m,d}=await fixture(t),proxy=await startProxy(service.url,{plan:[{path:'/pull',mode:'delay',delayMs:150}]});t.after(proxy.close);const old=m.pullRequest(),transport=new HttpTransport(proxy.url,'M',{attempts:1});const delayed=transport.call('/pull',old);
 // Wait until the old request has captured its authority read before making a new update.
 const deadline=Date.now()+3000;while(proxy.stats.captured===0){assert.ok(Date.now()<deadline,'proxy capture timeout');await new Promise(r=>setTimeout(r,2));}d.enqueue('increment',1);await d.synchronize(service.url);const fresh=m.pullRequest();m.install(await transport.call('/pull',fresh),fresh);const response=await delayed;assert.throws(()=>m.install(response,old),/STALE_RESPONSE/);assert.equal(m.confirmed().count,1);assert.equal(m.meta().cursor,1);
});
test('SQLite injected change-log abort rolls back effect, outcome and cursor together',async t=>{
 const {service,m}=await fixture(t);m.enqueue('increment',1);const op=m.pending()[0].operation;service.authority.db.exec("CREATE TEMP TRIGGER fail_log BEFORE INSERT ON changes BEGIN SELECT RAISE(ABORT,'injected log failure'); END;");assert.throws(()=>service.authority.submit('M',op),/injected log failure/);const state=service.authority.stats();assert.equal(state.record.count,0);assert.equal(state.outcomes,0);assert.equal(state.meta.head,0);service.authority.db.exec('DROP TRIGGER fail_log');assert.equal(service.authority.submit('M',op).status,'accepted');assert.equal(service.authority.current().count,1);
});
test('SQLite injected checkpoint abort preserves original projection, queue and receipts',async t=>{
 const {service,m}=await fixture(t);m.enqueue('increment',2);const op=m.pending()[0].operation;service.authority.submit('M',op);const request=m.pullRequest(),page=service.authority.pull('M',request);m.db.exec("CREATE TEMP TRIGGER fail_checkpoint BEFORE UPDATE ON meta BEGIN SELECT RAISE(ABORT,'injected checkpoint failure'); END;");assert.throws(()=>m.install(page,request),/injected checkpoint failure/);assert.equal(m.confirmed().count,0);assert.equal(m.meta().cursor,0);assert.equal(m.receipts().length,0);assert.equal(m.pending()[0].status,'queued');m.db.exec('DROP TRIGGER fail_checkpoint');m.install(page,request);assert.equal(m.view().count,2);assert.equal(m.pending().length,0);
});
test('conflicting offline writes retain rejected intent and require a new resolution ID',async t=>{
 const {service,m,d}=await fixture(t);const original=m.enqueue('title','Plan');d.enqueue('title','Proposal');await d.synchronize(service.url);await m.synchronize(service.url);assert.equal(m.pending()[0].status,'conflict');assert.equal(m.pending()[0].operation.payload.title,'Plan');const next=m.resolve(original,'title','Combined');assert.notEqual(next,original);await m.synchronize(service.url);await d.synchronize(service.url);assert.equal(d.confirmed().title,'Combined');
});
test('current revocation blocks read/write/replay and preserves private pending evidence',async t=>{
 const {service,m}=await fixture(t);m.enqueue('increment',1);const op=m.pending()[0].operation;service.authority.submit('M',op);service.authority.allow('M',false);assert.throws(()=>service.authority.submit('M',op),/FORBIDDEN/);assert.throws(()=>service.authority.pull('M',m.pullRequest()),/FORBIDDEN/);await assert.rejects(m.synchronize(service.url),/FORBIDDEN/);assert.equal(m.pending().length,1);
});
test('same ID with changed payload and forged scope fails without accepted mutation',async t=>{
 const {service,m}=await fixture(t);m.enqueue('increment',1);const op=m.pending()[0].operation;service.authority.submit('M',op);assert.throws(()=>service.authority.submit('M',{...op,payload:{delta:2}}),/ID_REUSED/);assert.throws(()=>service.authority.submit('M',{...op,tenant:'other'}),/BAD_SHAPE/);assert.equal(service.authority.current().count,1);
});
test('mixed operation schema versions fail explicitly while private work remains available',async t=>{
 const {service,m}=await fixture(t);m.enqueue('increment',1);const original=m.pending()[0].operation;assert.throws(()=>service.authority.submit('M',{...original,schema:2}),/UPGRADE_REQUIRED/);assert.equal(m.pending()[0].operation.opId,original.opId);assert.equal(service.authority.current().count,0);
});
test('stale replica after actual pruning resets with retained outcome evidence',async t=>{
 const {service,m}=await fixture(t);m.enqueue('increment',4);service.authority.submit('M',m.pending()[0].operation);service.authority.prune();const request=m.pullRequest(),page=service.authority.pull('M',request);assert.equal(page.mode,'snapshot');m.install(page,request);assert.equal(m.view().count,4);assert.equal(m.pending().length,0);assert.equal(service.authority.stats().changes,0);
});
test('simulated same-epoch rollback page behind client checkpoint is rejected',async t=>{
 const {service,m}=await fixture(t);m.enqueue('increment',1);await m.synchronize(service.url);const request=m.pullRequest(),page=service.authority.pull('M',request);assert.throws(()=>m.install({...page,mode:'snapshot',records:[{id:'task-7',title:'Draft',count:0,version:0,deleted:false}],head:0,next:0,more:false,changes:undefined},request));assert.equal(m.confirmed().count,1);
 // Exact-shape rollback page reaches the explicit rollback check.
 const {changes,...common}=page;assert.throws(()=>m.install({...common,mode:'snapshot',records:[{id:'task-7',title:'Draft',count:0,version:0,deleted:false}],head:0,next:0,more:false},request),/SOURCE_ROLLBACK/);
});
for(const fault of ['before-server-commit','after-server-commit'])test(`supervised SIGKILL ${fault} recovers one accepted durable operation`,async t=>{
 const dir=await mkdtemp(join(tmpdir(),'sync-g-process-'));t.after(()=>rm(dir,{recursive:true,force:true}));const path=join(dir,'server.sqlite'),first=await authorityProcess(path,{fault});t.after(first.stop);const m=new OfflineClient(join(dir,'M.sqlite'),'M');t.after(()=>m.close());await m.synchronize(first.url);m.enqueue('increment',2);await assert.rejects(m.synchronize(first.url));const [,signal]=await first.exited;assert.equal(signal,'SIGKILL');const restored=new Authority(path);assert.equal(restored.current().count,fault==='before-server-commit'?0:2);restored.close();const second=await authorityProcess(path);t.after(second.stop);await m.synchronize(second.url);assert.equal(m.confirmed().count,2);assert.equal(m.pending().length,0);
});
for(const fault of ['before-client-install','after-client-install','after-response-before-receipt'])test(`supervised client SIGKILL ${fault} recovers coherent local state`,async t=>{
 const {dir,service,m,d}=await fixture(t);if(fault==='after-response-before-receipt')m.enqueue('increment',2);else{d.enqueue('increment',1);await d.synchronize(service.url);}
 await crashedClient(['sync',join(dir,'M.sqlite'),'M',service.url],fault);if(fault==='before-client-install'){assert.equal(m.meta().cursor,0);assert.equal(m.confirmed().count,0);}else if(fault==='after-client-install'){assert.equal(m.meta().cursor,1);assert.equal(m.confirmed().count,1);}else assert.equal(m.pending()[0].status,'queued');await m.synchronize(service.url);assert.equal(m.confirmed().count,fault==='after-response-before-receipt'?2:1);assert.equal(m.pending().length,0);
});
test('fault proxy refuses non-loopback targets',async()=>{await assert.rejects(startProxy('https://example.com'),/LOOPBACK_TARGET_REQUIRED/);});

test('supervisor reports startup failure rather than waiting forever for readiness',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'sync-g-invalid-'));try{await assert.rejects(authorityProcess(dir),/SERVER_EXIT_BEFORE_READY/);}finally{await rm(dir,{recursive:true,force:true});}
});
