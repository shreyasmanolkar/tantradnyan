import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import * as c from '../crdt.mjs';
import {round} from '../ot.mjs';
import {Store} from '../storage.mjs';
import {SyncServer,SyncClient} from '../engine.mjs';
import {Network} from '../network.mjs';
import {Decoder,encode} from '../framing.mjs';
import {LeaseAuthority,backoff,Mutex} from '../mechanisms.mjs';
import {scenario} from '../../20-production-sync-engine/src/scenario.mjs';
import {start} from '../../20-production-sync-engine/src/server.mjs';
import {once} from 'node:events';
const orders=a=>a.length ? a.flatMap((v,i)=>orders(a.filter((_,j)=>j!==i)).map(xs=>[v,...xs])) : [[]];
test('OT pair diamond for every valid single-character operation pair on ABC',()=>{
  const operations=id=>[...[0,1,2,3].map(pos=>({id,type:'insert',pos,char:id[0]})),...[0,1,2].map(pos=>({id,type:'delete',pos}))];
  for(const a of operations('A:1'))for(const b of operations('B:1')) {
    const r=round('ABC',a,b);assert.equal(r.finalA,r.finalB,JSON.stringify({a,b,r}));
  }
});
test('CRDT merge laws for eight types including delay and duplicate delivery',()=>{
  const specs=[
    [c.gMerge,[{A:1},{B:2},{A:3,C:1}]],
    [c.pnMerge,[c.pnAdd(c.pnEmpty(),'A',1),c.pnAdd(c.pnEmpty(),'B',-2),c.pnAdd(c.pnEmpty(),'C',3)]],
    [c.setMerge,[['a'],['b'],['c']]],
    [c.twoMerge,[c.twoAdd(c.twoEmpty(),'x'),c.twoRemove(c.twoEmpty(),'x'),c.twoAdd(c.twoEmpty(),'y')]],
    [c.orMerge,[c.orAdd(c.orEmpty(),'x','A:1'),c.orRemove(c.orAdd(c.orEmpty(),'x','A:1'),'x'),c.orAdd(c.orEmpty(),'x','B:1')]],
    [c.lwwMerge,[{tag:[1,'A'],value:1},{tag:[1,'B'],value:2},{tag:[2,'A'],value:3}]],
    [c.mapMerge,[c.mapWrite({},'x',1,[1,'A']),c.mapWrite({},'x',{deleted:true},[2,'B']),c.mapWrite({},'y',3,[1,'C'])]],
    [c.textMerge,[c.textInsert(c.textEmpty(),[1,'A'],null,'a'),c.textInsert(c.textEmpty(),[1,'B'],null,'b'),c.textRemove(c.textEmpty(),c.textID([1,'A']))]]
  ];
  for(const [merge,[a,b,d]] of specs) {
    assert.deepEqual(merge(a,b),merge(b,a));assert.deepEqual(merge(a,a),a);
    assert.deepEqual(merge(merge(a,b),d),merge(a,merge(b,d)));
    const expected=merge(merge(a,b),d);
    for(const sequence of orders([a,b,d,a]))assert.deepEqual(sequence.reduce(merge),expected);
  }
});
test('OR-Set removes only observed tags; 2P-Set can never re-add',()=>{
  const a=c.orAdd(c.orEmpty(),'x','A:1'),remove=c.orRemove(a,'x'),newAdd=c.orAdd(a,'x','B:1');
  assert.deepEqual(c.orValue(c.orMerge(remove,newAdd)),['x']);
  assert.deepEqual(c.orValue(c.orRemove(c.orMerge(remove,newAdd),'x')),[]);
  const removed=c.twoRemove(c.twoAdd(c.twoEmpty(),'x'),'x');assert.deepEqual(c.twoValue(c.twoAdd(removed,'x')),[]);
});
test('text deletion can precede insertion; missing ancestors are repaired',()=>{
  const root=c.textInsert(c.textEmpty(),[1,'A'],null,'a');
  const child=c.textInsert(c.textEmpty(),[2,'A'],c.textID([1,'A']),'b');
  assert.equal(c.textValue(child),'');
  const tombstone=c.textRemove(c.textEmpty(),c.textID([1,'A']));
  assert.equal(c.textValue(c.textMerge(c.textMerge(child,tombstone),root)),'b');
});
test('framing survives every split point and rejects oversized headers',()=>{
  const message=encode({unicode:'🙂λ'});
  for(let i=0;i<=message.length;i++) {
    const values=[],d=new Decoder(x=>values.push(x));d.push(message.subarray(0,i));d.push(message.subarray(i));assert.deepEqual(values,[{unicode:'🙂λ'}]);
  }
  const bad=Buffer.alloc(4);bad.writeUInt32BE(65537);assert.throws(()=>new Decoder(()=>{}).push(bad),/large/);
});
test('seeded event schedules are reproducible; disconnected endpoints drop deliveries',()=>{
  function trace() {const n=new Network();n.endpoint('B',()=>{});for(let i=0;i<20;i++)n.send('A','B',{i});n.advance(5000);return n.trace;}
  assert.deepEqual(trace(),trace());
  const n=new Network({loss:0});let count=0;n.endpoint('B',()=>count++);n.send('A','B',{});n.blocked.add('B');n.advance(2000);assert.equal(count,0);
});
test('durable dedup after file-backed restart and compaction',()=>{
  const dir=mkdtempSync(join(tmpdir(),'sync-lab-')),path=join(dir,'server.json');
  const a=new SyncClient('A',new Store(join(dir,'client.json'))),op=a.mutate('x',1);
  let s=new SyncServer(new Store(path));const original=s.accept(op).entry;
  s.compact();s=new SyncServer(new Store(path));const result=s.accept(op);
  assert.equal(result.duplicate,true);assert.deepEqual(result.entry,original);assert.equal(s.data.seq,1);
  const restarted=new SyncClient('A',new Store(join(dir,'client.json')));
  restarted.receive(s.sync(0,[op.id]));assert.deepEqual(restarted.view(),{x:1});assert.equal(restarted.data.pending.length,0);
  assert.equal(JSON.parse(readFileSync(path)).seq,1);
});
test('same ID changed payload is rejected; ACK failure cannot precede commit',()=>{
  const store=new Store(),s=new SyncServer(store),a=new SyncClient('A'),op=a.mutate('x',1);s.accept(op);
  assert.throws(()=>s.accept({...op,value:2}),/reused/);
  const broken=new Store();broken.save=()=>{throw Error('disk full');};const b=new SyncServer(broken);
  assert.throws(()=>b.accept(op),/disk full/);assert.equal(b.data.seq,0);
});
test('newer snapshot prevents a delayed old snapshot rolling state backward',()=>{
  const s=new SyncServer(),a=new SyncClient('A');s.accept(a.mutate('x',1));s.compact();const old=s.sync(0,[]);
  s.accept({...a.mutate('x',2),expected:1});s.compact();const fresh=s.sync(0,[]);
  a.receive(fresh);a.receive(old);assert.equal(a.data.cursor,2);assert.equal(a.view().x,2);
});
test('leases fence a paused old owner and retries are bounded',()=>{
  const l=new LeaseAuthority(),old=l.acquire('A',0,10);assert.equal(l.acquire('B',5,10),null);
  const current=l.acquire('B',10,10);assert.equal(l.write(old,11),false);assert.equal(l.write(current,11),true);
  assert.equal(backoff(100,1),10000);
});
test('mutex releases on exception',async()=>{
  const lock=new Mutex();await assert.rejects(lock.withLock(()=>{throw Error('abort');}));assert.equal(await lock.withLock(()=>42),42);
});
test('20 loss/reordering schedules converge, including 100 writers',()=>{
  for(let seed=1;seed<=20;seed++)scenario({seed,clients:seed===20?100:3});
});
test('real WebSocket recovery after offline edit and actual server process restart',{timeout:20000},async()=>{
  const dir=mkdtempSync(join(tmpdir(),'sync-ws-'));
  // Separate OS child process owns the authoritative server file.
  const {spawn}=await import('node:child_process');
  const serverPath=new URL('../../20-production-sync-engine/src/server.mjs',import.meta.url);
  const provisional=await start({port:0,path:join(dir,'unused.json')}),port=provisional.port;await provisional.close();
  async function spawnServer() {
    const child=spawn(process.execPath,[serverPath.pathname],{env:{...process.env,SYNC_PORT:String(port),SYNC_STORE:join(dir,'server.json')},stdio:['ignore','pipe','pipe']});
    await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error('early exit '+code)));});return child;
  }
  const a=new SyncClient('A',new Store(join(dir,'A.json'))),b=new SyncClient('B',new Store(join(dir,'B.json')));
  const sockets=[];let child;
  async function connect(client) {
    const ws=new WebSocket('ws://127.0.0.1:'+port);sockets.push(ws);await once(ws,'open');
    ws.onmessage=e=>client.receive(JSON.parse(e.data));client.connect(body=>ws.send(JSON.stringify(body)));return ws;
  }
  async function settle(clients,predicate) {
    const end=Date.now()+5000;
    while(Date.now()<end) {clients.forEach(c=>c.tick());await new Promise(r=>setTimeout(r,20));if(predicate())return;}
    throw Error('recovery timed out');
  }
  try {
    child=await spawnServer();const wa=await connect(a),wb=await connect(b);a.mutate('x',1);
    await settle([a,b],()=>a.data.cursor===1&&b.data.cursor===1);
    b.disconnect();wb.close();await once(wb,'close');b.mutate('y','offline');
    const connectionClosed=wa.readyState===3?Promise.resolve():once(wa,'close');
    const exited=once(child,'exit');child.kill('SIGKILL');await exited;
    await connectionClosed;a.disconnect();child=await spawnServer();
    await connect(a);await connect(b);
    await settle([a,b],()=>a.data.cursor===2&&b.data.cursor===2&&!b.data.pending.length);
    assert.deepEqual(a.view(),{x:1,y:'offline'});assert.deepEqual(a.view(),b.view());
  } finally {
    for(const ws of sockets)if(ws.readyState<2)ws.close();
    if(child && child.exitCode===null){const done=once(child,'exit');child.kill('SIGKILL');await done;}
  }
});
