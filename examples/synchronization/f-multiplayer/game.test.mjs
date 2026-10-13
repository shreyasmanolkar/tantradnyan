import test from 'node:test';import assert from 'node:assert/strict';import dgram from 'node:dgram';import {fork} from 'node:child_process';import {once} from 'node:events';
import {World,FixedClock} from './simulation.mjs';import {Predictor,Interpolator,renderTick} from './prediction.mjs';import {FaultLink} from './faults.mjs';import {startServer} from './server.mjs';import {GameClient,waitFor} from './client.mjs';import {packet,snapshot} from './protocol.mjs';
function pair(options={}){const world=new World(options);world.join('M');return {world,client:new Predictor('M',world.snapshot('M'),{lead:0})};}
async function fixture(t,options={}){const server=await startServer({automatic:false,...options}),m=new GameClient('M',{resend:false}),d=new GameClient('D',{resend:false});t.after(async()=>{await m.close();await d.close();await server.close();});await m.connect(server.address.port);await d.connect(server.address.port);return {server,m,d};}
test('fixed timestep advances only whole steps and caps stall catch-up work',()=>{
 const clock=new FixedClock(0);let steps=0;assert.equal(clock.advance(49,()=>steps++),0);assert.equal(clock.advance(50,()=>steps++),1);assert.equal(clock.advance(1050,()=>steps++),5);assert.equal(steps,6);assert.equal(clock.droppedMs,750);assert.throws(()=>clock.advance(1049,()=>{}),/BAD_CLOCK/);
});
test('prediction reconciles an authoritative collision then removes finalized inputs',()=>{
 const {world,client}=pair();for(let i=0;i<3;i++)client.input(1);assert.equal(client.predicted,150);world.receive('M',client.packet());for(let i=0;i<3;i++)world.step();assert.equal(client.reconcile(world.snapshot('M')).error,-30);assert.equal(client.predicted,120);assert.equal(client.pending.size,0);
});
test('reconciliation replays only unfinalized inputs over authoritative base',()=>{
 const {world,client}=pair({right:1000});for(let i=0;i<3;i++)client.input(1);world.receive('M',client.packet());world.step();client.reconcile(world.snapshot('M'));assert.equal(client.confirmed,50);assert.equal(client.predicted,150);assert.deepEqual([...client.pending.keys()],[2,3]);
});
test('lost deadline means neutral finality rather than indefinite replay of late input',()=>{
 const {world,client}=pair({right:1000});client.input(1);const late=client.packet();world.step();world.receive('M',late);world.step();client.reconcile(world.snapshot('M'));assert.equal(client.predicted,0);assert.equal(client.pending.size,0);assert.equal(world.stats.stale,1);
});
test('redundant pending commands repair a lost packet before the scheduled slot',()=>{
 const world=new World({right:1000});world.join('M');const client=new Predictor('M',world.snapshot('M'),{lead:2});client.input(1);client.packet();world.step();world.receive('M',client.packet());world.step();world.step();client.reconcile(world.snapshot('M'));assert.equal(client.confirmed,50);assert.equal(world.stats.applied,1);
});
test('duplicate and reordered packets cannot run one input slot twice',()=>{
 const {world,client}=pair({right:1000});client.input(1);const first=client.packet();client.input(1);const second=client.packet();world.receive('M',second);world.receive('M',first);world.receive('M',first);world.step();world.step();assert.equal(world.players.get('M').x,100);assert.equal(world.stats.duplicate,1);assert.equal(world.stats.applied,2);
});
test('changed IDs, future slots and a malformed batch do not partially mutate input state',()=>{
 const {world,client}=pair();client.input(1);const first=client.packet();world.receive('M',first);assert.throws(()=>world.receive('M',{...first,commands:[{seq:1,dir:-1}]}),/PACKET_ID_REUSED/);
 assert.throws(()=>world.receive('M',{...first,packetSeq:2,commands:[{seq:2,dir:1},{seq:99,dir:1}]}),/FUTURE_INPUT/);assert.equal(world.sessions.get('M').commands.has(2),false);
 assert.throws(()=>world.receive('M',{...first,packetSeq:3,commands:[{seq:1,dir:-1}]}),/INPUT_ID_REUSED/);
});
test('packet frequency never allows more than one fixed movement step per server tick',()=>{
 const {world,client}=pair({right:1000});for(let i=0;i<12;i++)client.input(1);for(let i=0;i<60;i++)world.receive('M',client.packet());world.step();assert.equal(world.players.get('M').x,50);assert.equal(world.stats.applied,1);assert.throws(()=>client.input(1),/PREDICTION_WINDOW_FULL/);
});
test('old session/epoch commands are fenced and explicit rejoin starts fresh slots',()=>{
 const {world,client}=pair();client.input(1);const old=client.packet();world.join('M');assert.throws(()=>world.receive('M',old),/SESSION_REJECTED/);const fresh=world.snapshot('M');assert.throws(()=>client.reconcile(fresh),/SESSION_CHANGED/);const restart=new World();restart.join('M');assert.throws(()=>world.receive('M',{...old,session:fresh.session,epoch:restart.epoch}),/SESSION_REJECTED/);
});
test('stale snapshots cannot rewind prediction, and invalid snapshots preserve local state',()=>{
 const {world,client}=pair();client.input(1);world.receive('M',client.packet());const initial=world.snapshot('M');world.step();const current=world.snapshot('M');client.reconcile(current);assert.equal(client.reconcile(initial).stale,true);assert.equal(client.confirmed,50);assert.throws(()=>client.reconcile({...current,tick:2,ack:99}),/BAD_SNAPSHOT/);assert.equal(client.confirmed,50);
});
test('interpolation brackets server ticks and holds instead of unbounded extrapolation',()=>{
 const {world}=pair(),base=world.snapshot('M'),frames=new Interpolator();frames.push({...base,tick:2,ack:2,players:[{id:'M',x:0},{id:'D',x:0}]});frames.push({...base,tick:4,ack:4,players:[{id:'M',x:0},{id:'D',x:100}]});assert.deepEqual(frames.sample('D',3),{mode:'interpolate',x:50});assert.equal(frames.sample('D',10).mode,'hold-latest');assert.equal(frames.sample('D',0).mode,'hold-oldest');assert.equal(frames.push({...base,tick:3,ack:3}),false);assert.equal(renderTick({...base,tick:4},100,150,2),3);
});
test('entity absence is explicit rather than interpolating from an invented position',()=>{
 const {world}=pair(),base=world.snapshot('M'),frames=new Interpolator();frames.push({...base,tick:1,ack:1,players:[{id:'M',x:0},{id:'D',x:50}]});frames.push({...base,tick:2,ack:2,players:[{id:'M',x:0}]});assert.deepEqual(frames.sample('D',1.5),{mode:'missing',x:null});
});
test('seeded loss, duplication, jitter and reorder schedules reproduce and reconcile',()=>{
 function run(){const {world,client}=pair({right:1000}),uplink=new FaultLink({seed:7,loss:0.3,duplicate:0.4,maxDelay:3}),downlink=new FaultLink({seed:11,loss:0.2,duplicate:0.4,maxDelay:2});
  for(let now=0;now<30;now++){if(now<12){try{client.input(now%3===0?-1:1);}catch(error){assert.match(error.message,/PREDICTION_WINDOW_FULL/);}}uplink.send(now,client.packet(),m=>world.receive('M',m));uplink.deliver(now);world.step();downlink.send(now,world.snapshot('M'),s=>client.reconcile(s));downlink.deliver(now);}
  // Restore delivery and provide a final full snapshot; expired commands stay finalized.
  client.reconcile(world.snapshot('M'));return {state:world.players.get('M').x,predicted:client.predicted,pending:client.pending.size,up:uplink.stats,down:downlink.stats};}
 const a=run(),b=run();assert.deepEqual(a,b);assert.equal(a.state,a.predicted);assert.equal(a.pending,0);assert.ok(a.up.dropped>0);assert.ok(a.up.duplicated>0);
});
test('a complete simulated partition discards expired inputs then repairs current state',()=>{
 const {world,client}=pair();client.input(1);const lost=new FaultLink({seed:2,loss:1});lost.send(0,client.packet(),m=>world.receive('M',m));for(let i=0;i<8;i++)world.step();client.reconcile(world.snapshot('M'));assert.equal(client.predicted,0);assert.equal(client.pending.size,0);client.input(-1);world.receive('M',client.packet());world.step();client.reconcile(world.snapshot('M'));assert.equal(client.confirmed,-50);
});
test('actual UDP clients predict, receive snapshots and observe another player',async t=>{
 const {server,m,d}=await fixture(t);m.input(1);assert.equal(m.core.predicted,50);await waitFor(()=>server.world.stats.received===1);for(let i=0;i<3;i++)server.step();await waitFor(()=>m.core.ack===3&&d.core.tick===3);assert.equal(m.core.confirmed,50);assert.equal(m.core.pending.size,0);assert.equal(d.latest.players.find(p=>p.id==='M').x,50);
});
test('application-dropped real UDP input is repaired by redundant resend before deadline',async t=>{
 const server=await startServer({automatic:false});let dropped=false;const m=new GameClient('M',{resend:false,dropOutbound:p=>{if(p.type==='input'&&!dropped){dropped=true;return true;}return false;}});t.after(async()=>{await m.close();await server.close();});await m.connect(server.address.port);m.input(1);assert.equal(m.stats.droppedOut,1);server.step();m.resendPending();await waitFor(()=>server.world.stats.received===1);server.step();server.step();await waitFor(()=>m.core.ack===3);assert.equal(m.core.confirmed,50);
});
test('application-dropped real UDP snapshots recover from the next full snapshot',async t=>{
 const server=await startServer({automatic:false});let lost=0;const m=new GameClient('M',{resend:false,dropInbound:p=>p.type==='snapshot'&&lost++<2});t.after(async()=>{await m.close();await server.close();});await m.connect(server.address.port);for(let i=0;i<3;i++)server.step();await waitFor(()=>m.core.tick===3);assert.equal(m.stats.droppedIn,2);assert.equal(m.core.ack,3);
});
test('fixture authentication, endpoint binding and forged position fields are enforced',async t=>{
 const {server,m}=await fixture(t),rogue=dgram.createSocket('udp4');await new Promise(r=>rogue.bind(0,'127.0.0.1',r));t.after(()=>new Promise(r=>rogue.close(r)));
 const send=value=>rogue.send(packet(value),server.address.port,'127.0.0.1');send({type:'hello',v:1,token:'invalid',nonce:server.world.epoch});send(m.core.packet());await waitFor(()=>server.stats.unauthorized>=2);
 m.send({...m.core.packet(),x:999999});await waitFor(()=>server.stats.invalid>0);assert.equal(server.world.players.get('M').x,0);
});
test('replaced UDP session cannot accept an old connected client command',async t=>{
 const {server,m}=await fixture(t),replacement=new GameClient('M',{resend:false});t.after(()=>replacement.close());await replacement.connect(server.address.port);m.input(1);await waitFor(()=>server.stats.unauthorized>0);for(let i=0;i<4;i++)server.step();await waitFor(()=>replacement.core.ack===4);assert.equal(replacement.core.confirmed,0);
});
test('oversized datagrams are rejected within the loopback protocol budget',async t=>{
 const {server,m}=await fixture(t);m.socket.send(Buffer.alloc(1300),()=>{});await waitFor(()=>server.stats.invalid>0);assert.equal(server.world.stats.applied,0);
});
test('automatic fixed-step server progresses and expires a disconnected session',async t=>{
 const server=await startServer({leaseMs:150,automatic:true}),m=new GameClient('M',{resend:false});t.after(async()=>{await m.close();await server.close();});await m.connect(server.address.port);await waitFor(()=>server.world.tick>=2);await m.disconnect();await waitFor(()=>server.stats.expired===1);assert.equal(server.world.sessions.size,0);
});
async function childServer(t){const cp=fork(new URL('./cli.mjs',import.meta.url),['serve','0'],{execArgv:[],stdio:['ignore','pipe','pipe','ipc']});cp.stdout.resume();cp.stderr.resume();const exit=once(cp,'exit');t.after(async()=>{if(cp.exitCode===null&&cp.signalCode===null){cp.kill('SIGTERM');const timer=setTimeout(()=>cp.kill('SIGKILL'),1500);try{await exit;}finally{clearTimeout(timer);}}});const timer=setTimeout(()=>cp.kill('SIGKILL'),5000);try{const [m]=await once(cp,'message');return {cp,exit,...m};}finally{clearTimeout(timer);}}
test('actual server SIGKILL creates a new ephemeral match epoch; explicit rejoin resets prediction',async t=>{
 const first=await childServer(t),m=new GameClient('M',{resend:false});t.after(()=>m.close());await m.connect(first.port);const old=m.core.epoch;m.input(1);first.cp.kill('SIGKILL');const [,signal]=await first.exit;assert.equal(signal,'SIGKILL');await m.disconnect();const restarted=await childServer(t);assert.notEqual(restarted.epoch,old);await m.connect(restarted.port);assert.equal(m.core.epoch,restarted.epoch);assert.equal(m.core.confirmed,0);assert.equal(m.core.pending.size,0);
});

test('repeated hello after lost welcome preserves the assigned session',async t=>{
 const server=await startServer({automatic:false});let first=null;const m=new GameClient('M',{resend:false,dropInbound:value=>{if(value.type==='welcome'&&first===null){first=value.state.session;return true;}return false;}});t.after(async()=>{await m.close();await server.close();});await m.connect(server.address.port);assert.equal(m.core.session,first);assert.equal(server.world.sessions.size,1);assert.equal(m.stats.droppedIn,1);
});
test('revocation stops subsequent UDP inputs and snapshot disclosure',async t=>{
 const {server,m,d}=await fixture(t);server.world.revoke('D');d.input(1);await waitFor(()=>server.stats.unauthorized>0);m.input(1);await waitFor(()=>server.world.stats.received===1);for(let i=0;i<3;i++)server.step();await waitFor(()=>m.core.tick===3);assert.equal(d.core.tick,0);assert.equal(m.latest.players.some(p=>p.id==='D'),false);assert.equal(server.world.players.get('D').x,0);
});
