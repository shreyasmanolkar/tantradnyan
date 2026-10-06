import {createHash} from 'node:crypto';
export class Mutex {
  constructor() {this.tail=Promise.resolve();}
  async withLock(fn) {
    const previous=this.tail;let release;
    this.tail=new Promise(resolve=>{release=resolve;});
    await previous;try {return await fn();} finally {release();}
  }
}
// Atomic only within one JS agent: no await occurs in compareAndSet.
export class VersionedCell {
  constructor(value) {this.value=structuredClone(value);this.version=0;}
  read() {return {value:structuredClone(this.value),version:this.version};}
  compareAndSet(expected,value) {
    if (expected!==this.version) return false;
    this.value=structuredClone(value);this.version++;return true;
  }
}
export class MVCC {
  constructor(values) {this.values={...values};this.versions=Object.fromEntries(Object.keys(values).map(k=>[k,0]));}
  begin() {return {snapshot:{...this.values},versions:{...this.versions},reads:new Set(),writes:{}};}
  read(t,k) {t.reads.add(k);return Object.hasOwn(t.writes,k)?t.writes[k]:t.snapshot[k];}
  write(t,k,v) {t.writes[k]=v;}
  commit(t,validateReads=false) {
    const keys=validateReads?new Set([...t.reads,...Object.keys(t.writes)]):Object.keys(t.writes);
    if ([...keys].some(k=>this.versions[k]!==t.versions[k])) return false;
    for (const [k,v] of Object.entries(t.writes)) {this.values[k]=v;this.versions[k]=(this.versions[k]||0)+1;}
    return true;
  }
}
export class LeaseAuthority {
  constructor() {this.epoch=0;this.until=0;this.owner=null;this.resourceFence=0;}
  acquire(owner,now,ttl) {
    if (now<this.until) return null;
    this.owner=owner;this.until=now+ttl;return ++this.epoch;
  }
  write(token,now) {
    if (token!==this.epoch || now>=this.until || token<this.resourceFence) return false;
    this.resourceFence=token;return true;
  }
}
export const backoff = (attempt,random=0.5,base=250,cap=10000) => Math.floor(random*Math.min(cap,base*2**Math.min(attempt,30)));
const hash=s=>createHash('sha256').update(s).digest('hex');
// Fixed key partitioning, deterministic JSON values; caller supplies stable
// schema/serialization. General canonical JSON is outside this toy.
export function merkle(entries) {
  const rows=Object.entries(entries).sort(([a],[b])=>a<b?-1:a>b?1:0);
  function build(items) {
    if (!items.length) return {hash:hash('empty')};
    if (items.length===1) {const [key,value]=items[0];return {hash:hash('leaf:'+JSON.stringify([key,value])),key,value};}
    const mid=Math.floor(items.length/2),left=build(items.slice(0,mid)),right=build(items.slice(mid));
    return {hash:hash('node:'+left.hash+right.hash),left,right};
  }
  return build(rows);
}
export function merkleDiff(a,b) {
  if (a.hash===b.hash) return [];
  // Same key set/tree shape required for efficient paired descent.
  if (a.key!==undefined && b.key===a.key) return [a.key];
  if (a.left && b.left) return [...merkleDiff(a.left,b.left),...merkleDiff(a.right,b.right)];
  const keys=new Set();const walk=n=>{if(n.key!==undefined)keys.add(n.key);if(n.left){walk(n.left);walk(n.right);}};
  walk(a);walk(b);return [...keys].sort();
}
export const gameStep = (x,input) => Math.max(0,Math.min(100,x+Math.max(-1,Math.min(1,input))));
export function reconcile(snapshot,pending) {return pending.filter(i=>i.seq>snapshot.ack).reduce((x,i)=>gameStep(x,i.dx),snapshot.x);}
export function interpolate(a,b,time) {
  if (b.t<=a.t) throw Error('increasing snapshot times required');
  const f=Math.max(0,Math.min(1,(time-a.t)/(b.t-a.t)));return a.x+(b.x-a.x)*f;
}
export class GameServer {
  constructor() {this.x=0;this.ack=0;this.buffer=new Map();}
  input(op) {
    if (!Number.isSafeInteger(op.seq) || op.seq<1 || !Number.isFinite(op.dx) || Math.abs(op.dx)>1) throw Error('invalid input');
    if (op.seq<=this.ack) return this.snapshot();
    if (op.seq>this.ack+256) throw Error('input window exceeded');
    this.buffer.set(op.seq,op);
    while(this.buffer.has(this.ack+1)) {const i=this.buffer.get(++this.ack);this.buffer.delete(this.ack);this.x=gameStep(this.x,i.dx);}
    return this.snapshot();
  }
  snapshot() {return {x:this.x,ack:this.ack};}
}
