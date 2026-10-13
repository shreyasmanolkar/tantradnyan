import {MAX_LEAD,TICK_MS,int,command,snapshot,move} from './protocol.mjs';
export class Predictor {
 constructor(actor,initial,{lead=2,right=1000}={}){
  if(!['M','D'].includes(actor)||!Number.isInteger(lead)||lead<0||lead>=MAX_LEAD)throw new Error('BAD_PREDICTOR');snapshot(initial);
  this.actor=actor;this.epoch=initial.epoch;this.session=initial.session;this.startTick=initial.startTick;this.lead=lead;this.right=right;this.pending=new Map();this.ack=initial.ack;this.tick=initial.tick;this.nextSeq=this.ack+lead+1;this.packetSeq=0;this.confirmed=initial.players.find(p=>p.id===actor)?.x;if(this.confirmed===undefined)throw new Error('MISSING_SELF');this.predicted=this.confirmed;this.corrections=[];
 }
 input(dir){
  if(![-1,0,1].includes(dir))throw new Error('BAD_DIRECTION');const seq=Math.max(this.nextSeq,this.ack+this.lead+1);if(seq>this.ack+MAX_LEAD)throw new Error('PREDICTION_WINDOW_FULL');
  const c={seq,dir};command(c);this.pending.set(seq,c);this.nextSeq=seq+1;this.predicted=move(this.predicted,dir,this.right);return c;
 }
 packet(){if(!int(this.packetSeq+1))throw new Error('PACKET_SEQUENCE_LIMIT');return {type:'input',v:1,epoch:this.epoch,session:this.session,packetSeq:++this.packetSeq,commands:[...this.pending.values()].sort((a,b)=>a.seq-b.seq)};}
 reconcile(value){
  snapshot(value);if(value.epoch!==this.epoch||value.session!==this.session||value.startTick!==this.startTick)throw new Error('SESSION_CHANGED');if(value.tick<=this.tick)return {stale:true,error:0};
  const self=value.players.find(p=>p.id===this.actor);if(!self)throw new Error('MISSING_SELF');
  const before=this.predicted;this.confirmed=self.x;this.ack=value.ack;this.tick=value.tick;
  for(const seq of this.pending.keys())if(seq<=this.ack)this.pending.delete(seq);
  this.predicted=this.confirmed;for(const c of [...this.pending.values()].sort((a,b)=>a.seq-b.seq))this.predicted=move(this.predicted,c.dir,this.right);
  const error=this.predicted-before;this.corrections.push(error);this.nextSeq=Math.max(this.nextSeq,this.ack+this.lead+1);return {stale:false,error};
 }
}
export class Interpolator {
 constructor(){this.frames=[];}
 push(value){snapshot(value);if(this.frames.length&&value.epoch!==this.frames.at(-1).epoch)throw new Error('EPOCH_CHANGED');if(this.frames.length&&value.tick<=this.frames.at(-1).tick)return false;this.frames.push(structuredClone(value));if(this.frames.length>32)this.frames.shift();return true;}
 sample(actor,targetTick){
  if(!Number.isFinite(targetTick))throw new Error('BAD_RENDER_TIME');if(!this.frames.length)return {mode:'missing',x:null};
  const first=this.frames[0],last=this.frames.at(-1),position=f=>f.players.find(p=>p.id===actor)?.x??null;
  if(targetTick<=first.tick)return {mode:'hold-oldest',x:position(first)};if(targetTick>=last.tick)return {mode:'hold-latest',x:position(last)};
  for(let i=1;i<this.frames.length;i++){const a=this.frames[i-1],b=this.frames[i];if(targetTick>b.tick)continue;const x0=position(a),x1=position(b);if(x0===null||x1===null)return {mode:'missing',x:null};const alpha=(targetTick-a.tick)/(b.tick-a.tick);return {mode:'interpolate',x:x0+(x1-x0)*alpha};}
 }
}
export function renderTick(latest,receivedAt,now,delayTicks=2){if(!Number.isFinite(now)||now<receivedAt)throw new Error('BAD_RENDER_CLOCK');return latest.tick+(now-receivedAt)/TICK_MS-delayTicks;}
