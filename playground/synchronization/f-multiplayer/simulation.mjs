import {randomUUID} from 'node:crypto';
import {TICK_MS,MAX_LEAD,int,command,shape,move} from './protocol.mjs';
export class World {
 constructor({right=120}={}){if(!Number.isInteger(right)||right< -1000||right>1000)throw new Error('BAD_BOUND');this.right=right;this.epoch=randomUUID();this.tick=0;this.players=new Map();this.sessions=new Map();this.allowed=new Set(['M','D']);this.stats={received:0,duplicate:0,stale:0,neutral:0,applied:0};}
 join(actor){
  if(!this.allowed.has(actor))throw new Error('FORBIDDEN');
  const prior=this.sessions.get(actor),session={actor,id:randomUUID(),startTick:this.tick,commands:new Map(),packets:new Map(),maxPacket:0};
  if(!this.players.has(actor))this.players.set(actor,{id:actor,x:0});this.sessions.set(actor,session);return {session,previous:prior?.id};
 }
 receive(actor,message){
  shape(message,['type','v','epoch','session','packetSeq','commands']);
  const s=this.sessions.get(actor);if(!this.allowed.has(actor)||!s||message.session!==s.id||message.epoch!==this.epoch)throw new Error('SESSION_REJECTED');
  if(message.type!=='input'||message.v!==1||!int(message.packetSeq)||message.packetSeq<1||!Array.isArray(message.commands)||message.commands.length>MAX_LEAD)throw new Error('BAD_INPUT');
  const fingerprint=JSON.stringify(message.commands),prior=s.packets.get(message.packetSeq);
  if(prior!==undefined){if(prior!==fingerprint)throw new Error('PACKET_ID_REUSED');this.stats.duplicate++;return;}
  if(message.packetSeq<s.maxPacket-64){this.stats.stale++;return;}
  const ack=this.tick-s.startTick,next=new Map(s.commands);let stale=0;
  for(const c of message.commands){command(c);if(c.seq<=ack){stale++;continue;}if(c.seq>ack+MAX_LEAD)throw new Error('FUTURE_INPUT');const old=next.get(c.seq);if(old!==undefined&&old!==c.dir)throw new Error('INPUT_ID_REUSED');next.set(c.seq,c.dir);}
  // Validate the complete packet before modifying authoritative input state.
  s.commands=next;s.packets.set(message.packetSeq,fingerprint);s.maxPacket=Math.max(s.maxPacket,message.packetSeq);
  for(const id of s.packets.keys())if(id<s.maxPacket-64)s.packets.delete(id);
  this.stats.received++;this.stats.stale+=stale;
 }
 step(){
  if(!int(this.tick+1))throw new Error('MATCH_TOO_LONG');this.tick++;
  for(const [actor,s] of this.sessions){if(!this.allowed.has(actor))continue;const seq=this.tick-s.startTick,dir=s.commands.get(seq);
   if(dir===undefined)this.stats.neutral++;else this.stats.applied++;
   this.players.get(actor).x=move(this.players.get(actor).x,dir??0,this.right);s.commands.delete(seq);
  }
 }
 snapshot(actor){const s=this.sessions.get(actor);if(!s||!this.allowed.has(actor))throw new Error('FORBIDDEN');return {type:'snapshot',v:1,epoch:this.epoch,session:s.id,tick:this.tick,startTick:s.startTick,ack:this.tick-s.startTick,players:[...this.players.values()].filter(p=>this.allowed.has(p.id)&&this.sessions.has(p.id)).map(p=>({...p}))};}
 revoke(actor){this.allowed.delete(actor);this.sessions.delete(actor);}
}
export class FixedClock {
 constructor(now=0){this.last=now;this.accumulator=0;this.droppedMs=0;}
 advance(now,step){
  if(!Number.isFinite(now)||now<this.last)throw new Error('BAD_CLOCK');const elapsed=now-this.last;this.last=now;
  const accepted=Math.min(elapsed,TICK_MS*5);this.droppedMs+=elapsed-accepted;this.accumulator+=accepted;
  let count=0;while(this.accumulator>=TICK_MS&&count<5){step();this.accumulator-=TICK_MS;count++;}return count;
 }
}
