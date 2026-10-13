import dgram from 'node:dgram';import {randomUUID} from 'node:crypto';import {performance} from 'node:perf_hooks';import {EventEmitter} from 'node:events';
import {Predictor,Interpolator,renderTick} from './prediction.mjs';import {shape,uuid,packet,parse,snapshot} from './protocol.mjs';
export async function waitFor(fn,{timeout=4000}={}){const end=performance.now()+timeout;while(!fn()){if(performance.now()>end)throw new Error('WAIT_TIMEOUT');await new Promise(r=>setTimeout(r,10));}}
export class GameClient extends EventEmitter {
 constructor(actor,{resend=true,dropOutbound=()=>false,dropInbound=()=>false}={}){super();if(!['M','D'].includes(actor))throw new Error('BAD_ACTOR');this.actor=actor;this.resend=resend;this.dropOutbound=dropOutbound;this.dropInbound=dropInbound;this.socket=null;this.core=null;this.frames=new Interpolator();this.lastReceived=0;this.latest=null;this.closed=true;this.timer=null;this.stats={sent:0,droppedOut:0,droppedIn:0,invalid:0,stale:0};}
 send(value){if(this.closed)throw new Error('DISCONNECTED');if(this.dropOutbound(value)){this.stats.droppedOut++;return;}this.socket.send(packet(value),()=>{});this.stats.sent++;}
 async connect(port){
  if(!this.closed)throw new Error('ALREADY_CONNECTED');if(!Number.isInteger(port)||port<1||port>65535)throw new Error('BAD_PORT');
  this.socket=dgram.createSocket('udp4');this.closed=false;const nonce=randomUUID();let ready=false;
  const welcome=new Promise((resolve,reject)=>{
   this.socket.on('message',bytes=>{
    try{const m=parse(bytes);if(this.dropInbound(m)){this.stats.droppedIn++;return;}
     if(m.type==='welcome'){
      shape(m,['type','v','nonce','state']);if(m.v!==1||m.nonce!==nonce||!uuid(m.nonce))throw new Error('BAD_WELCOME');snapshot(m.state);if(ready)return;
      // Explicit new connection discards expired gameplay commands, never replays an old match.
      this.core=new Predictor(this.actor,m.state);this.frames=new Interpolator();this.frames.push(m.state);this.latest=m.state;this.lastReceived=performance.now();ready=true;resolve();this.emit('state');
     }else{if(!ready)return;snapshot(m);const result=this.core.reconcile(m);if(result.stale){this.stats.stale++;return;}this.frames.push(m);this.latest=m;this.lastReceived=performance.now();this.emit('state');}
    }catch{this.stats.invalid++;}
   });
   this.socket.on('error',error=>{this.stats.invalid++;if(!ready)reject(error);});
  });
  try{
   await new Promise((resolve,reject)=>{this.socket.once('error',reject);this.socket.bind(0,'127.0.0.1',resolve);});
   await new Promise((resolve,reject)=>{this.socket.connect(port,'127.0.0.1',error=>error?reject(error):resolve());});
   const hello={type:'hello',v:1,token:this.actor==='M'?'mira-demo':'dev-demo',nonce};
   for(let attempt=0;attempt<3&&!ready;attempt++){
    this.send(hello);await Promise.race([welcome,new Promise(r=>setTimeout(r,120))]);
   }
   if(!ready)throw new Error('JOIN_TIMEOUT');
   if(this.resend)this.timer=setInterval(()=>{try{this.send(this.core.packet());}catch{this.stats.invalid++;}},50);
  }catch(error){await this.disconnect();throw error;}
 }
 input(dir){if(!this.core||this.closed)throw new Error('DISCONNECTED');const c=this.core.input(dir);this.send(this.core.packet());this.emit('prediction');return c;}
 resendPending(){this.send(this.core.packet());}
 remote(actor,now=performance.now()){if(!this.latest)return {mode:'missing',x:null};return this.frames.sample(actor,renderTick(this.latest,this.lastReceived,now));}
 async disconnect(){if(this.timer)clearInterval(this.timer);this.timer=null;if(this.closed)return;this.closed=true;await new Promise(r=>this.socket.close(r));}
 async close(){await this.disconnect();}
}
