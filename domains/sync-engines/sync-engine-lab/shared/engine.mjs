import {Store} from './storage.mjs';
const copy = structuredClone;
const validActor = a => typeof a === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(a);
const validKey = k => typeof k === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(k) && !['__proto__','constructor','prototype'].includes(k);
export class SyncServer {
  constructor(store = new Store()) {
    this.store = store;
    this.data = store.load({seq:0,base:0,state:{},snapshot:{seq:0,state:{}},log:[],receipts:{}});
  }
  accept(op) {
    if (!validActor(op.actor) || !Number.isSafeInteger(op.counter) || op.counter < 1 || op.id !== op.actor+':'+op.counter || !validKey(op.key) || !Number.isSafeInteger(op.expected) || op.expected < 0 || JSON.stringify(op.value) === undefined || JSON.stringify(op.value).length > 8192) throw Error('invalid operation');
    if (Object.hasOwn(this.data.receipts,op.id)) {
      const previous = this.data.receipts[op.id];
      if (JSON.stringify(previous.op) !== JSON.stringify(op)) throw Error('operation ID reused with different payload');
      return {entry:copy(previous),duplicate:true};
    }
    const d = copy(this.data), current = d.state[op.key]?.seq || 0;
    const entry = {seq:++d.seq,op:copy(op),conflict:op.expected !== current};
    d.state[op.key] = {value:copy(op.value),seq:entry.seq};
    d.log.push(entry); d.receipts[op.id] = entry;
    // Receipt, assigned sequence, log entry and projected state commit together.
    this.store.save(d); this.data = d;
    return {entry:copy(entry),duplicate:false};
  }
  sync(cursor,pendingIDs = []) {
    if (!Number.isSafeInteger(cursor) || cursor < 0 || cursor > this.data.seq) throw Error('invalid cursor or server history rolled back');
    if (!Array.isArray(pendingIDs) || pendingIDs.length > 256 || pendingIDs.some(id => typeof id !== 'string' || id.length > 90)) throw Error('invalid pending IDs');
    const receipts = pendingIDs.filter(id => Object.hasOwn(this.data.receipts,id)).map(id => copy(this.data.receipts[id]));
    if (cursor < this.data.base) return {type:'sync',mode:'snapshot',head:this.data.seq,state:copy(this.data.state),receipts};
    return {type:'sync',mode:'log',head:this.data.seq,entries:copy(this.data.log.filter(e => e.seq > cursor)),receipts};
  }
  compact() {
    const d = copy(this.data); d.snapshot = {seq:d.seq,state:copy(d.state)};
    d.base = d.seq; d.log = []; this.store.save(d); this.data = d;
    // Dedup receipts remain: trimming a log must not make an old retry new.
  }
  receive(message,peer,send,broadcast) {
    if (message.type === 'ping') send(peer,{type:'pong',requestID:message.requestID});
    else if (message.type === 'hello') send(peer,this.sync(message.cursor,message.pending));
    else if (message.type === 'op') {
      const result = this.accept(message.op);
      send(peer,{type:'entry',entry:result.entry,ack:true});
      if (!result.duplicate) broadcast({type:'entry',entry:result.entry});
    } else throw Error('unknown message');
  }
}
export class SyncClient {
  constructor(actor,store = new Store()) {
    if (!validActor(actor)) throw Error('invalid actor');
    this.store = store; this.data = store.load({actor,next:0,cursor:0,confirmed:{},pending:[]});
    if (this.data.actor !== actor) throw Error('persisted actor mismatch');
    this.buffer = new Map(); this.ready = false; this.connected = false;
    this.send = () => {}; this.events = [];
  }
  save() { this.store.save(this.data); }
  connect(send) { this.connected = true; this.ready = false; this.send = send; this.tick(); }
  disconnect() { this.connected = false; this.ready = false; }
  mutate(key,value) {
    if (this.data.pending.length >= 256) throw Error('outbox full: user intervention required');
    if (!validKey(key) || JSON.stringify(value) === undefined || JSON.stringify(value).length > 8192) throw Error('invalid key/value');
    const next = this.data.next+1;
    if (!Number.isSafeInteger(next)) throw Error('actor counter exhausted');
    const op = {id:this.data.actor+':'+next,actor:this.data.actor,counter:next,key,value:copy(value),expected:this.data.confirmed[key]?.seq || 0};
    // Persist local counter and pending operation before any transmission.
    const before = copy(this.data);
    this.data.next = next; this.data.pending.push(op);
    try { this.save(); } catch (e) { this.data = before; throw e; }
    return copy(op);
  }
  view() {
    const view = Object.fromEntries(Object.entries(this.data.confirmed).map(([k,r]) => [k,copy(r.value)]));
    for (const op of this.data.pending) view[op.key] = copy(op.value);
    return view;
  }
  tick() {
    if (!this.connected) return;
    // Cursor reconciliation heals even a silently dropped last broadcast.
    this.send({type:'hello',cursor:this.data.cursor,pending:this.data.pending.map(o => o.id)});
    // Stop-and-wait keeps this client's submitted writes in outbox order.
    if (this.ready && this.data.pending.length) this.send({type:'op',op:copy(this.data.pending[0])});
  }
  ingest(entry) {
    if (entry.seq <= this.data.cursor) {
      this.data.pending = this.data.pending.filter(o => o.id !== entry.op.id); return;
    }
    this.buffer.set(entry.seq,copy(entry));
    if (this.buffer.size > 1024) { this.buffer.clear(); this.ready = false; return; }
    while (this.buffer.has(this.data.cursor+1)) {
      const e = this.buffer.get(this.data.cursor+1); this.buffer.delete(e.seq);
      this.data.confirmed[e.op.key] = {value:copy(e.op.value),seq:e.seq};
      this.data.cursor = e.seq;
      this.data.pending = this.data.pending.filter(o => o.id !== e.op.id);
      this.events.push({seq:e.seq,id:e.op.id,conflict:e.conflict});
    }
  }
  receive(message) {
    if (message.type === 'entry') this.ingest(message.entry);
    else if (message.type === 'sync') {
      if (message.mode === 'snapshot' && message.head >= this.data.cursor) {
        this.data.confirmed = copy(message.state); this.data.cursor = message.head;
        for (const seq of this.buffer.keys()) if (seq <= message.head) this.buffer.delete(seq);
      }
      for (const e of message.entries || []) this.ingest(e);
      // Receipt ACKs <= cursor are already represented by confirmed state.
      for (const e of message.receipts || []) this.ingest(e);
      this.ready = true;
    } else throw Error('unknown server message');
    this.save();
  }
}
