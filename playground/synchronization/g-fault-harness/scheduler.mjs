import {Journal} from './journal.mjs';
export class Random {
 constructor(seed){if(!Number.isInteger(seed)||seed<1||seed>4294967295)throw new Error('BAD_SEED');this.state=seed>>>0;}
 next(){let x=this.state;x^=x<<13;x^=x>>>17;x^=x<<5;this.state=x>>>0;return this.state/4294967296;}
 integer(bound){if(!Number.isInteger(bound)||bound<1)throw new Error('BAD_BOUND');return Math.floor(this.next()*bound);}
}
export class Scheduler {
 constructor({seed=1,loss=0.2,duplicate=0.3,maxDelay=4,maxQueued=4096}={}){
  if(!Number.isFinite(loss)||loss<0||loss>1||!Number.isFinite(duplicate)||duplicate<0||duplicate>1||!Number.isInteger(maxDelay)||maxDelay<0||maxDelay>100||!Number.isInteger(maxQueued)||maxQueued<1)throw new Error('BAD_SCHEDULE');
  this.random=new Random(seed);this.loss=loss;this.duplicate=duplicate;this.maxDelay=maxDelay;this.maxQueued=maxQueued;this.now=0;this.ordinal=0;this.queue=[];this.journal=new Journal();this.stats={sent:0,dropped:0,duplicates:0,delivered:0};
 }
 send(label,message,receiver,{onDrop=()=>{}}={}){
  this.stats.sent++;this.journal.append({at:this.now,type:'send',label});
  if(this.random.next()<this.loss){this.stats.dropped++;this.journal.append({at:this.now,type:'drop',label});onDrop();return;}
  const enqueue=()=>{if(this.queue.length>=this.maxQueued)throw new Error('SCHEDULER_QUEUE_FULL');const at=this.now+1+this.random.integer(this.maxDelay+1);this.queue.push({at,ordinal:this.ordinal++,label,message:structuredClone(message),receiver});this.journal.append({at:this.now,type:'schedule',label,due:at});};
  enqueue();if(this.random.next()<this.duplicate){this.stats.duplicates++;enqueue();}
 }
 advance(now){if(!Number.isInteger(now)||now<this.now)throw new Error('BAD_TIME');this.now=now;this.queue.sort((a,b)=>a.at-b.at||a.ordinal-b.ordinal);const due=this.queue.filter(e=>e.at<=now);this.queue=this.queue.filter(e=>e.at>now);for(const e of due){this.stats.delivered++;this.journal.append({at:now,type:'deliver',label:e.label});e.receiver(e.message);}}
 drain({maxRounds=10000}={}){if(!Number.isInteger(maxRounds)||maxRounds<1)throw new Error('BAD_DRAIN_BUDGET');let rounds=0;while(this.queue.length){if(rounds++>=maxRounds)throw new Error('DRAIN_BUDGET');this.advance(Math.max(this.now+1,Math.min(...this.queue.map(e=>e.at))));}}
}
