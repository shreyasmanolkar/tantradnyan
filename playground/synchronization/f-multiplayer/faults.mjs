// A reproducible logical scheduler. It is not an operating-system packet emulator.
export class FaultLink {
 constructor({seed=1,loss=0,duplicate=0,maxDelay=0}={}){if(!Number.isInteger(seed)||seed<1||seed>4294967295||loss<0||loss>1||duplicate<0||duplicate>1||!Number.isInteger(maxDelay)||maxDelay<0)throw new Error('BAD_FAULT_CONFIG');this.state=seed>>>0;this.loss=loss;this.duplicate=duplicate;this.maxDelay=maxDelay;this.queue=[];this.ordinal=0;this.stats={sent:0,dropped:0,duplicated:0,delivered:0};}
 random(){let x=this.state;x^=x<<13;x^=x>>>17;x^=x<<5;this.state=x>>>0;return this.state/4294967296;}
 send(now,message,receiver){this.stats.sent++;if(this.random()<this.loss){this.stats.dropped++;return;}const add=()=>this.queue.push({at:now+Math.floor(this.random()*(this.maxDelay+1)),ordinal:this.ordinal++,message:structuredClone(message),receiver});add();if(this.random()<this.duplicate){add();this.stats.duplicated++;}}
 deliver(now){this.queue.sort((a,b)=>a.at-b.at||a.ordinal-b.ordinal);const due=this.queue.filter(x=>x.at<=now);this.queue=this.queue.filter(x=>x.at>now);for(const x of due){x.receiver(x.message);this.stats.delivered++;}return due.length;}
}
