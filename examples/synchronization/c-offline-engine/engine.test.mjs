import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {Authority} from './authority.mjs';
import {OfflineClient,HttpTransport} from './client.mjs';
import {startServer} from './server.mjs';
import {open,transaction} from './storage.mjs';
async function fixture(t){
  const dir=await mkdtemp(join(tmpdir(),'sync-offline-test-'));
  const service=await startServer(join(dir,'s.sqlite'));
  const m=new OfflineClient(join(dir,'m.sqlite'),'M'),d=new OfflineClient(join(dir,'d.sqlite'),'D');
  t.after(async()=>{m.close();d.close();await service.close();await rm(dir,{recursive:true,force:true});});
  await m.synchronize(service.url);await d.synchronize(service.url);
  return {dir,service,m,d};
}
function killHook(){process.kill(process.pid,'SIGKILL');}
async function child(args,fault){
  const cp=fork(new URL('./cli.mjs',import.meta.url),args,{execArgv:[],stdio:['ignore','pipe','pipe','ipc'],env:{...process.env,LAB_FAULT:fault??''}});
  let stderr='';cp.stderr.on('data',x=>stderr+=x);cp.stdout.resume();
  cp.on('error',()=>{});
  const exit=once(cp,'exit');
  return {cp,exit,error:()=>stderr,stop:async()=>{if(cp.exitCode===null&&cp.signalCode===null){cp.kill('SIGTERM');const timer=setTimeout(()=>cp.kill('SIGKILL'),2000);try{await exit;}finally{clearTimeout(timer);}}}};
}
async function serverChild(t,path,fault){
  const process=await child(['serve',path,'0'],fault);t.after(process.stop);
  const timer=setTimeout(()=>process.cp.kill('SIGKILL'),5000);
  try{const [message]=await once(process.cp,'message');return {...process,url:message.url};}finally{clearTimeout(timer);}
}
async function crashClient(args,fault){const p=await child(args,fault);const [code,signal]=await p.exit;assert.equal(signal,'SIGKILL',p.error());assert.equal(code,null);}

test('offline edits survive close/reopen with original identity and derived view',async t=>{
  const {dir,service,m}=await fixture(t);const id=m.enqueue('title','Plan');
  const reopened=new OfflineClient(join(dir,'m.sqlite'),'M');t.after(()=>reopened.close());
  assert.equal(reopened.pending()[0].operation.opId,id);assert.equal(reopened.view().title,'Plan');assert.equal(reopened.confirmed().title,'Draft');
  await reopened.synchronize(service.url);assert.equal(reopened.confirmed().title,'Plan');assert.equal(m.pending().length,0);
});
test('two offline devices merge increments but retain the stale title for human review',async t=>{
  const {service,m,d}=await fixture(t);m.enqueue('title','Plan');m.enqueue('increment',2);d.enqueue('title','Proposal');d.enqueue('increment',3);
  await d.synchronize(service.url);service.authority.prune();await m.synchronize(service.url);
  assert.equal(m.confirmed().title,'Proposal');assert.equal(m.confirmed().count,5);assert.equal(m.pending()[0].status,'conflict');assert.equal(m.pending()[0].operation.payload.title,'Plan');
  const old=m.pending()[0].operation.opId,newId=m.resolve(old,'title','Combined');assert.notEqual(old,newId);await m.synchronize(service.url);await d.synchronize(service.url);assert.deepEqual(m.confirmed(),d.confirmed());assert.equal(d.confirmed().title,'Combined');
});
test('queued conditional children do not run after a rejected parent even if version matches',async t=>{
  const {service,m,d}=await fixture(t);m.enqueue('title','First');m.enqueue('title','Second');d.enqueue('increment',1);await d.synchronize(service.url);await m.synchronize(service.url);
  assert.deepEqual(m.pending().map(x=>x.status),['conflict','conflict']);assert.equal(m.receipts().at(-1).reason,'DEPENDENCY_FAILED');assert.equal(m.confirmed().title,'Draft');
});
test('ordered dependent local title edits succeed when the base stays valid',async t=>{
  const {service,m}=await fixture(t);m.enqueue('title','First');m.enqueue('title','Second');await m.synchronize(service.url);assert.equal(m.confirmed().title,'Second');assert.equal(m.pending().length,0);
});
test('duplicate and concurrent HTTP submissions commit one effect; changed ID payload fails',async t=>{
  const {service,m}=await fixture(t);m.enqueue('increment',2);const op=m.pending()[0].operation,tr=new HttpTransport(service.url,'M');
  const [a,b]=await Promise.all([tr.call('/submit',op),tr.call('/submit',op)]);assert.deepEqual(a,b);assert.equal(service.authority.current().count,2);
  await assert.rejects(tr.call('/submit',{...op,payload:{delta:3}}),/ID_REUSED/);await m.synchronize(service.url);assert.equal(m.view().count,2);assert.equal(m.pending().length,0);
});
test('snapshot after pruning reconciles an unknown success without double optimistic increment',async t=>{
  const {service,m}=await fixture(t);m.enqueue('increment',4);service.authority.submit('M',m.pending()[0].operation);service.authority.prune();
  const request=m.pullRequest(),page=service.authority.pull('M',request);assert.equal(page.mode,'snapshot');m.install(page,request);assert.equal(m.view().count,4);assert.equal(m.pending().length,0);assert.equal(m.meta().cursor,1);
});
test('paginated deltas apply the full contiguous prefix, including numeric sequence 10',async t=>{
  const {service,m,d}=await fixture(t);for(let i=0;i<13;i++)d.enqueue('increment',1);await d.synchronize(service.url);await m.synchronize(service.url);assert.equal(m.confirmed().count,13);assert.equal(m.meta().cursor,13);
});
test('malformed, reordered and stale responses cannot advance or partly overwrite the projection',async t=>{
  const {service,m,d}=await fixture(t);d.enqueue('increment',1);d.enqueue('increment',1);await d.synchronize(service.url);
  const request=m.pullRequest(),page=service.authority.pull('M',request),before=m.confirmed();
  assert.throws(()=>m.install({...page,changes:page.changes.toReversed()},request),/NONCONTIGUOUS/);assert.deepEqual(m.confirmed(),before);assert.equal(m.meta().cursor,0);
  assert.throws(()=>m.install({...page,next:99},request),/BAD_PAGE/);m.install(page,request);assert.throws(()=>m.install(page,request),/STALE_RESPONSE/);assert.equal(m.meta().cursor,2);
});
test('tombstone prevents stale offline edits and increments from resurrecting a deleted record',async t=>{
  const {service,m,d}=await fixture(t);m.enqueue('title','Offline title');m.enqueue('increment',2);d.enqueue('delete');await d.synchronize(service.url);await m.synchronize(service.url);
  assert.equal(m.confirmed().deleted,true);assert.deepEqual(m.pending().map(x=>x.status),['rejected','rejected']);assert.equal(service.authority.current().count,0);assert.throws(()=>m.resolve(m.pending()[0].operation.opId,'title','Restore'),/DELETED/);
});
test('revocation gates reads, writes and old accepted outcomes; queued work is not erased',async t=>{
  const {service,m}=await fixture(t);m.enqueue('increment',1);const op=m.pending()[0].operation;service.authority.submit('M',op);service.authority.allow('M',false);
  await assert.rejects(m.synchronize(service.url),/FORBIDDEN/);assert.equal(m.pending().length,1);assert.throws(()=>service.authority.submit('M',op),/FORBIDDEN/);service.authority.allow('M',true);await m.synchronize(service.url);assert.equal(m.confirmed().count,1);
});
test('expired credentials do not justify replacing logical operation identity',async t=>{
  const {service,m}=await fixture(t);const id=m.enqueue('increment',1);
  const response=await fetch(service.url+'/submit',{method:'POST',headers:{authorization:'Bearer expired'},body:JSON.stringify(m.pending()[0].operation)});assert.equal(response.status,401);assert.equal(m.pending()[0].operation.opId,id);await m.synchronize(service.url);assert.equal(m.confirmed().count,1);
});
test('epoch reset preserves current state and quarantines old unresolved work',async t=>{
  const {service,m}=await fixture(t);m.enqueue('increment',3);const op=m.pending()[0].operation;service.authority.submit('M',op);service.authority.rotate();await m.synchronize(service.url);
  assert.equal(m.pending()[0].status,'review');assert.equal(m.confirmed().count,3);assert.equal(m.view().count,3);assert.throws(()=>service.authority.submit('M',op),/EPOCH_CHANGED/);assert.equal(service.authority.stats().outcomes,0);
});
test('wire/schema versions, forged actors, future cursors and invalid payloads fail explicitly',async t=>{
  const {service,m}=await fixture(t);m.enqueue('increment',1);const op=m.pending()[0].operation;
  assert.throws(()=>service.authority.submit('M',{...op,schema:2}),/UPGRADE_REQUIRED/);assert.throws(()=>service.authority.submit('M',{...op,actor:'D'}),/BAD_SHAPE/);assert.throws(()=>service.authority.submit('M',{...op,payload:{delta:-1}}),/BAD_DELTA/);assert.throws(()=>service.authority.pull('M',{...m.pullRequest(),after:1}),/FUTURE_CURSOR/);
});
test('client actor binding and future disk-schema marker prevent accidental reuse',async t=>{
  const {dir}=await fixture(t);assert.throws(()=>new OfflineClient(join(dir,'m.sqlite'),'D'),/ACTOR_MISMATCH/);
  const path=join(dir,'future.sqlite'),db=open(path);db.exec('PRAGMA user_version=2');db.close();assert.throws(()=>new OfflineClient(path,'M'),/LOCAL_UPGRADE_REQUIRED/);assert.throws(()=>new Authority(path),/LOCAL_UPGRADE_REQUIRED/);
});
test('throw before client enqueue commit rolls back both intent and derived local view',async t=>{
  const {m}=await fixture(t);assert.throws(()=>m.enqueue('title','Lost',{beforeCommit:()=>{throw new Error('fault');}}),/fault/);assert.equal(m.pending().length,0);assert.equal(m.view().title,'Draft');
});
test('real client SIGKILL before enqueue commit leaves no proposed state',async t=>{
  const {dir,m}=await fixture(t);await crashClient(['enqueue',join(dir,'m.sqlite'),'M','title','Plan'],'before-enqueue');assert.equal(m.pending().length,0);assert.equal(m.view().title,'Draft');
});
test('real client SIGKILL after enqueue commit preserves operation identity and view',async t=>{
  const {dir,m,service}=await fixture(t);await crashClient(['enqueue',join(dir,'m.sqlite'),'M','title','Plan'],'after-enqueue');const id=m.pending()[0].operation.opId;assert.equal(m.view().title,'Plan');await m.synchronize(service.url);assert.equal(m.receipts().at(-1).opId,id);assert.equal(m.confirmed().title,'Plan');
});
test('real client SIGKILL after server response before local receipt recovers unknown success',async t=>{
  const {dir,m,service}=await fixture(t);m.enqueue('increment',2);await crashClient(['sync',join(dir,'m.sqlite'),'M',service.url],'after-response-before-receipt');assert.equal(service.authority.current().count,2);assert.equal(m.pending()[0].status,'queued');await m.synchronize(service.url);assert.equal(m.view().count,2);assert.equal(m.pending().length,0);
});
for(const fault of ['before-client-install','after-client-install'])test(`real client SIGKILL ${fault} preserves an atomic projection/checkpoint`,async t=>{
  const {dir,m,d,service}=await fixture(t);d.enqueue('increment',1);await d.synchronize(service.url);await crashClient(['sync',join(dir,'m.sqlite'),'M',service.url],fault);
  assert.equal(m.meta().cursor,fault==='before-client-install'?0:1);assert.equal(m.confirmed().count,fault==='before-client-install'?0:1);await m.synchronize(service.url);assert.equal(m.confirmed().count,1);
});
for(const fault of ['before-server-commit','after-server-commit'])test(`real authority SIGKILL ${fault} recovers effect/outcome/log consistently`,async t=>{
  const dir=await mkdtemp(join(tmpdir(),'sync-offline-crash-'));t.after(()=>rm(dir,{recursive:true,force:true}));
  const path=join(dir,'s.sqlite'),cp=await serverChild(t,path,fault),m=new OfflineClient(join(dir,'m.sqlite'),'M');t.after(()=>m.close());await m.synchronize(cp.url);m.enqueue('increment',2);
  await assert.rejects(m.synchronize(cp.url));const [,signal]=await cp.exit;assert.equal(signal,'SIGKILL');
  const inspect=new Authority(path);assert.equal(inspect.current().count,fault==='before-server-commit'?0:2);assert.equal(inspect.stats().outcomes,fault==='before-server-commit'?0:1);inspect.close();
  const restarted=await serverChild(t,path);await m.synchronize(restarted.url);assert.equal(m.confirmed().count,2);assert.equal(m.pending().length,0);const again=new Authority(path);assert.equal(again.stats().outcomes,1);assert.equal(again.stats().changes,1);again.close();
});
test('durability settings and integrity check describe actual local stores',async t=>{
  const {m}=await fixture(t);assert.equal(m.db.prepare('PRAGMA journal_mode').get().journal_mode,'wal');assert.equal(m.db.prepare('PRAGMA synchronous').get().synchronous,2);assert.equal(m.db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');
});

test('lost response retries the identical operation and cannot duplicate a committed increment',async t=>{
  const {service,m}=await fixture(t);m.enqueue('increment',2);const bodies=[];
  const transport=new HttpTransport(service.url,'M',{delayMs:0,fetchFn:async(url,options)=>{
    bodies.push(options.body);const response=await fetch(url,options);
    if(bodies.length===1){await response.text();throw new TypeError('simulated lost response after commit');}
    return response;
  }});
  const result=await transport.call('/submit',m.pending()[0].operation);assert.equal(result.status,'accepted');assert.equal(bodies.length,2);assert.equal(bodies[0],bodies[1]);assert.equal(service.authority.current().count,2);
});
test('authorization rejection is not retried; transient failure is bounded',async t=>{
  const {service,m}=await fixture(t);service.authority.allow('M',false);let calls=0;
  const forbidden=new HttpTransport(service.url,'M',{delayMs:0,fetchFn:(...args)=>{calls++;return fetch(...args);}});
  await assert.rejects(forbidden.call('/pull',m.pullRequest()),/FORBIDDEN/);assert.equal(calls,1);
  calls=0;const unavailable=new HttpTransport(service.url,'M',{attempts:3,delayMs:0,fetchFn:async()=>{calls++;throw new TypeError('offline');}});
  await assert.rejects(unavailable.call('/pull',m.pullRequest()),/offline/);assert.equal(calls,3);assert.equal(m.meta().cursor,0);
});
