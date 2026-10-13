import dgram from 'node:dgram';import {performance} from 'node:perf_hooks';
import {World,FixedClock} from './simulation.mjs';import {shape,uuid,packet,parse} from './protocol.mjs';
export async function startServer({port=0,automatic=true,leaseMs=5000}={}){
 const socket=dgram.createSocket('udp4'),world=new World(),endpoints=new Map(),retired=new Set();const stats={invalid:0,unauthorized:0,sent:0,expired:0};
 const retire=nonce=>{retired.add(nonce);if(retired.size>256)retired.delete(retired.values().next().value);};
 const send=(message,target)=>{const bytes=packet(message);socket.send(bytes,target.port,'127.0.0.1',()=>{});stats.sent++;};
 const broadcast=()=>{for(const [actor,target] of endpoints)if(world.allowed.has(actor))send(world.snapshot(actor),target);};
 socket.on('message',(bytes,remote)=>{
  if(remote.address!=='127.0.0.1')return;
  try{
   const m=parse(bytes);
   if(m.type==='hello'){
    shape(m,['type','v','token','nonce']);if(m.v!==1||!uuid(m.nonce))throw new Error('BAD_HELLO');const actor={'mira-demo':'M','dev-demo':'D'}[m.token];
    if(!actor||!world.allowed.has(actor)){stats.unauthorized++;return;}
    const old=endpoints.get(actor);
    if(retired.has(m.nonce))return;
    if(old?.nonce===m.nonce){if(old.port!==remote.port)return;old.lastSeen=performance.now();}
    else{if(old){retire(old.nonce);}world.join(actor);endpoints.set(actor,{port:remote.port,nonce:m.nonce,lastSeen:performance.now(),tokens:80,tokenAt:performance.now()});}
    const state=world.snapshot(actor);send({type:'welcome',v:1,nonce:m.nonce,state},endpoints.get(actor));
   }else{
    const actor=[...world.sessions].find(([,s])=>s.id===m.session)?.[0],target=endpoints.get(actor);
    if(!actor||!target||target.port!==remote.port){stats.unauthorized++;return;}
    const now=performance.now();target.tokens=Math.min(80,target.tokens+(now-target.tokenAt)*0.02);target.tokenAt=now;if(target.tokens<1)throw new Error('RATE_LIMIT');target.tokens--;
    world.receive(actor,m);target.lastSeen=now;
   }
  }catch{stats.invalid++;}
 });
 socket.on('error',()=>stats.invalid++);
 await new Promise((resolve,reject)=>{socket.once('error',reject);socket.bind(port,'127.0.0.1',resolve);});
 const clock=new FixedClock(performance.now());
 const timer=automatic?setInterval(()=>{
  const now=performance.now();for(const [actor,target] of endpoints)if(now-target.lastSeen>leaseMs||!world.allowed.has(actor)){retire(target.nonce);endpoints.delete(actor);world.sessions.delete(actor);stats.expired++;}
  clock.advance(now,()=>{world.step();if(world.tick%2===0)broadcast();});
 },5):null;
 return {world,stats,clock,address:socket.address(),broadcast,step:()=>{world.step();broadcast();},close:async()=>{if(timer)clearInterval(timer);await new Promise(r=>socket.close(r));}};
}
