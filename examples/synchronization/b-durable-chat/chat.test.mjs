import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import WebSocket from 'ws';
import {labConfig} from './lab-config.mjs';
import {Repository} from './repository.mjs';
import {ChatClient,projectPage} from './client.mjs';

async function processGateway(config,options={}){
  const child=fork(fileURLToPath(new URL('./server.mjs',import.meta.url)),[],{
    execArgv:[],stdio:['ignore','pipe','pipe','ipc'],env:{...process.env,CHAT_SCHEMA:config.schema,
      CHAT_DB_PORT:String(config.dbPort),CHAT_REDIS_PORT:String(config.redisPort),CHAT_PORT:'0',
      CHAT_PULL_MS:String(options.pullMs||200),CHAT_PUBLISH:options.publish===false?'0':'1',
      CHAT_CRASH_BEFORE_COMMIT_OP:options.before||'',CHAT_CRASH_AFTER_COMMIT_OP:options.after||''}});
  let logs='';child.stdout.on('data',x=>logs+=x);child.stderr.on('data',x=>logs+=x);
  const exit=new Promise(resolve=>child.once('exit',(code,signal)=>resolve({code,signal})));
  const ready=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('Gateway startup timeout: '+logs));},8000);
    child.once('error',e=>{clearTimeout(timer);reject(e);});
    child.once('exit',()=>{clearTimeout(timer);reject(new Error('Gateway exited before ready: '+logs));});
    child.on('message',m=>{if(m.kind==='ready'){clearTimeout(timer);resolve(m);}});
  });
  return {url:ready.url,exit,async stop(){
    if(child.exitCode!==null||child.signalCode!==null)return;
    child.kill('SIGTERM');
    const timer=setTimeout(()=>child.kill('SIGKILL'),3000);
    await exit;clearTimeout(timer);
  }};
}
function registerCleanup(t){
  const clients=[],processes=[];
  t.after(async()=>{
    await Promise.allSettled(clients.map(c=>c.close()));
    await Promise.allSettled(processes.map(p=>p.stop()));
  });
  return {clients,processes};
}
const emptyState=()=>({epoch:null,seq:'0',entries:new Map()});
const epoch='11111111-1111-4111-8111-111111111111';
const sample={channel:'general',epoch,after:'0',highWater:'1',entries:[{channel:'general',messageId:'msg-1',seq:'1',author:'M',body:'hello'}],nextCursor:{epoch,seq:'1'},hasMore:false};
test('client page projection advances only a validated contiguous prefix',()=>{
  const old=emptyState(),next=projectPage(old,sample);
  assert.equal(next.seq,'1');assert.equal(next.entries.size,1);assert.equal(old.seq,'0');
  assert.throws(()=>projectPage(old,{...sample,entries:[{...sample.entries[0],seq:'2'}]}),/Noncontiguous/);
  assert.equal(old.entries.size,0);
});
test('client rejects invalid page checkpoints and high-water bounds without partial state',()=>{
  const old=emptyState();
  assert.throws(()=>projectPage(old,{...sample,nextCursor:{epoch,seq:'2'}}),/high-water/);
  assert.throws(()=>projectPage(old,{...sample,highWater:'0'}),/high-water/);
  assert.throws(()=>projectPage({epoch,seq:'1',entries:new Map()},sample),/context/);
});

test('durable chat across PostgreSQL, Redis and real WebSocket gateway processes',{timeout:120000},async t=>{
  const schema='chat_lab_'+randomUUID().replaceAll('-','');const config=await labConfig(schema);const repo=new Repository(config);
  try{
    const version=await repo.init();console.log(`validated PostgreSQL ${version}`);
    let index=0;const fixture=async()=>{const c='case_'+(++index);await repo.addChannel(c);return c;};
    await t.test('authentication, subprotocol and per-channel authorization are separate checks',async t=>{
      const resources=registerCleanup(t);const gateway=await processGateway(config);resources.processes.push(gateway);
      const denied=new WebSocket(gateway.url,'chat.v1',{headers:{Authorization:'Bearer invalid'}});
      await assert.rejects(once(denied,'open'),/401/);
      const wrongProtocol=new WebSocket(gateway.url,'wrong.v1',{headers:{Authorization:'Bearer mira-demo'}});
      await assert.rejects(once(wrongProtocol,'open'),/400/);
      const dev=new ChatClient(gateway.url,'D');resources.clients.push(dev);
      await assert.rejects(dev.subscribe('private'),e=>e.code==='FORBIDDEN');
      assert.equal((await repo.stats('private')).messages,0);
    });
    await t.test('a second gateway receives broker wake-ups without its periodic catch-up timer',async t=>{
      const channel=await fixture(),resources=registerCleanup(t);
      const a=await processGateway(config,{pullMs:60000}),b=await processGateway(config,{pullMs:60000});resources.processes.push(a,b);
      const mira=new ChatClient(a.url,'M'),dev=new ChatClient(b.url,'D');resources.clients.push(mira,dev);
      await Promise.all([mira.subscribe(channel),dev.subscribe(channel)]);
      const accepted=await mira.submit(channel+':1','Across gateways',channel);
      await dev.waitForCount(1,5000);
      assert.equal(dev.entries[0].messageId,accepted.entry.messageId);assert.equal(dev.checkpoint.seq,'1');
    });
    await t.test('concurrent duplicate submissions commit one message and preserve original result',async t=>{
      const channel=await fixture(),resources=registerCleanup(t),gateway=await processGateway(config);resources.processes.push(gateway);
      const a=new ChatClient(gateway.url,'M'),b=new ChatClient(gateway.url,'M');resources.clients.push(a,b);
      const [x,y]=await Promise.all([a.submit(channel+':1','Only once',channel),b.submit(channel+':1','Only once',channel)]);
      assert.deepEqual(x.entry,y.entry);
      const stats=await repo.stats(channel);assert.equal(stats.messages,1);assert.equal(stats.results,1);assert.equal(stats.outbox,1);
      await assert.rejects(b.submit(channel+':1','Changed payload',channel),e=>e.code==='IDENTITY_REUSE');
    });
    await t.test('an accepted submission ACK alone does not advance a stream checkpoint',async t=>{
      const channel=await fixture(),resources=registerCleanup(t),gateway=await processGateway(config);resources.processes.push(gateway);
      const mira=new ChatClient(gateway.url,'M');resources.clients.push(mira);
      const ack=await mira.submit(channel+':1','Accepted but not streamed yet',channel);
      assert.equal(ack.entry.seq,'1');assert.equal(mira.checkpoint.seq,'0');
      await mira.subscribe(channel);await mira.waitForCount(1);assert.equal(mira.checkpoint.seq,'1');
    });
    await t.test('parameter binding preserves SQL-shaped text and rejects forged or invalid payloads',async t=>{
      const channel=await fixture(),resources=registerCleanup(t),gateway=await processGateway(config);resources.processes.push(gateway);
      const mira=new ChatClient(gateway.url,'M');resources.clients.push(mira);
      const body="'); DROP TABLE messages; -- 😀";
      assert.equal((await mira.submit(channel+':1',body,channel)).entry.body,body);
      await assert.rejects(mira.request({kind:'submit',opId:channel+':2',body:'forged',channel,author:'D'}),e=>e.code==='BAD_REQUEST');
      await assert.rejects(mira.submit(channel+':3','\0',channel),e=>e.code==='BAD_REQUEST');
      await assert.rejects(mira.submit(channel+':4','\ud800',channel),e=>e.code==='BAD_REQUEST');
      assert.equal((await repo.stats(channel)).messages,1);
    });
    await t.test('pagination delivers all 23 committed entries in contiguous channel order',async t=>{
      const channel=await fixture();for(let i=0;i<23;i++)await repo.submit('M',{opId:channel+':'+i,channel,body:'message '+i});
      const resources=registerCleanup(t),gateway=await processGateway(config);resources.processes.push(gateway);
      const dev=new ChatClient(gateway.url,'D');resources.clients.push(dev);await dev.subscribe(channel);await dev.waitForCount(23);
      assert.deepEqual(dev.entries.map(x=>x.seq),Array.from({length:23},(_,i)=>String(i+1)));assert.equal(dev.checkpoint.seq,'23');
    });
    await t.test('offline reader resumes after its checkpoint and receives only missed entries',async t=>{
      const channel=await fixture(),resources=registerCleanup(t),gateway=await processGateway(config);resources.processes.push(gateway);
      const mira=new ChatClient(gateway.url,'M'),dev=new ChatClient(gateway.url,'D');resources.clients.push(mira,dev);
      await Promise.all([mira.subscribe(channel),dev.subscribe(channel)]);await mira.submit(channel+':1','First',channel);await dev.waitForCount(1);
      const checkpoint=dev.checkpoint;await dev.close();await mira.submit(channel+':2','While offline',channel);
      const resumed=new ChatClient(gateway.url,'D',checkpoint);resources.clients.push(resumed);await resumed.subscribe(channel);await resumed.waitForCount(1);
      assert.deepEqual(resumed.entries.map(x=>x.seq),['2']);assert.equal(resumed.checkpoint.seq,'2');
    });
    await t.test('missing all publish hints is repaired by periodic durable-log catch-up',async t=>{
      const channel=await fixture(),resources=registerCleanup(t),gateway=await processGateway(config,{publish:false,pullMs:100});resources.processes.push(gateway);
      const mira=new ChatClient(gateway.url,'M'),dev=new ChatClient(gateway.url,'D');resources.clients.push(mira,dev);
      await dev.subscribe(channel);await mira.submit(channel+':1','No pubsub delivery',channel);await dev.waitForCount(1);
      assert.equal((await repo.stats(channel)).published,0);assert.equal(dev.entries[0].body,'No pubsub delivery');
    });
    await t.test('revocation blocks historical-result replay and further history disclosure',async t=>{
      const channel=await fixture(),resources=registerCleanup(t),gateway=await processGateway(config);resources.processes.push(gateway);
      const dev=new ChatClient(gateway.url,'D');resources.clients.push(dev);await dev.submit(channel+':1','Prior authorized content',channel);
      await repo.revoke('D',channel);
      await assert.rejects(dev.submit(channel+':1','Prior authorized content',channel),e=>e.code==='FORBIDDEN');
      await assert.rejects(dev.subscribe(channel),e=>e.code==='FORBIDDEN');assert.equal((await repo.stats(channel)).messages,1);
    });
    await t.test('future, expired and wrong-generation cursors cannot silently skip history',async t=>{
      const channel=await fixture();const accepted=await repo.submit('M',{opId:channel+':1',channel,body:'one'});
      const resources=registerCleanup(t),gateway=await processGateway(config);resources.processes.push(gateway);
      const future=new ChatClient(gateway.url,'D',{epoch:accepted.epoch,seq:'99'});resources.clients.push(future);
      await assert.rejects(future.subscribe(channel),e=>e.code==='BAD_CURSOR');
      const wrong=new ChatClient(gateway.url,'D',{epoch,seq:'0'});resources.clients.push(wrong);
      await assert.rejects(wrong.subscribe(channel),e=>e.code==='RESET_REQUIRED');
      await repo.setFloor(channel,'1');const expired=new ChatClient(gateway.url,'D');resources.clients.push(expired);
      await assert.rejects(expired.subscribe(channel),e=>e.code==='RESET_REQUIRED');assert.equal(expired.checkpoint.seq,'0');
    });
    await t.test('SIGKILL before commit rolls back message, replay result, outbox and sequence allocation',async t=>{
      const channel=await fixture(),opId=channel+':crash',resources=registerCleanup(t);
      const doomed=await processGateway(config,{before:opId});resources.processes.push(doomed);
      const sender=new ChatClient(doomed.url,'M');resources.clients.push(sender);
      await assert.rejects(sender.submit(opId,'Before commit',channel),/closed/);assert.equal((await doomed.exit).signal,'SIGKILL');
      const stats=await repo.stats(channel);assert.equal(stats.messages,0);assert.equal(stats.results,0);assert.equal(stats.outbox,0);
      const recovered=await processGateway(config);resources.processes.push(recovered);
      const retry=new ChatClient(recovered.url,'M');resources.clients.push(retry);
      assert.equal((await retry.submit(opId,'Before commit',channel)).entry.seq,'1');
    });
    await t.test('SIGKILL after commit before ACK survives restart and returns the same accepted message',async t=>{
      const channel=await fixture(),opId=channel+':crash',resources=registerCleanup(t);
      const doomed=await processGateway(config,{after:opId});resources.processes.push(doomed);
      const sender=new ChatClient(doomed.url,'M');resources.clients.push(sender);
      await assert.rejects(sender.submit(opId,'After commit',channel),/closed/);assert.equal((await doomed.exit).signal,'SIGKILL');
      assert.equal((await repo.stats(channel)).messages,1);
      const recovered=await processGateway(config);resources.processes.push(recovered);
      const retry=new ChatClient(recovered.url,'M'),reader=new ChatClient(recovered.url,'D');resources.clients.push(retry,reader);
      const ack=await retry.submit(opId,'After commit',channel);await reader.subscribe(channel);await reader.waitForCount(1);
      assert.equal(reader.entries[0].messageId,ack.entry.messageId);assert.equal(ack.entry.seq,'1');assert.equal((await repo.stats(channel)).messages,1);
    });
    await t.test('republishing an outbox notification does not repeat a client projection',async t=>{
      const channel=await fixture(),resources=registerCleanup(t),gateway=await processGateway(config);resources.processes.push(gateway);
      const reader=new ChatClient(gateway.url,'D');resources.clients.push(reader);await reader.subscribe(channel);
      const result=await repo.submit('M',{opId:channel+':1',channel,body:'Repeat wake only'});await reader.waitForCount(1);
      await repo.pool.query(`UPDATE ${repo.p}outbox SET published=false WHERE channel_id=$1;`,[channel]);
      await new Promise((resolve,reject)=>{
        const deadline=Date.now()+3000;
        const inspect=async()=>{try{if((await repo.stats(channel)).published===1)return resolve();if(Date.now()>deadline)return reject(new Error('Outbox not republished'));setTimeout(inspect,20);}catch(e){reject(e);}};inspect();
      });
      assert.equal(reader.entries.length,1);assert.equal(reader.entries[0].messageId,result.entry.messageId);
    });
  }finally{try{await repo.drop();}finally{await repo.close();}}
});
