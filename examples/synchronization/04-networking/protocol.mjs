import { TextDecoder } from 'node:util';
const utf8=new TextDecoder('utf-8',{fatal:true});
export const MAX_FRAME=16*1024;
export const MAX_DATAGRAM=1200;
function decodeJson(bytes) { return JSON.parse(utf8.decode(bytes)); }
export function encodeFrame(value) {
  const body=Buffer.from(JSON.stringify(value),'utf8');
  if(!body.length||body.length>MAX_FRAME)throw new Error('Frame size limit');
  const header=Buffer.alloc(4);header.writeUInt32BE(body.length);
  return Buffer.concat([header,body]);
}
export class FrameDecoder {
  #pending=Buffer.alloc(0);
  push(chunk) {
    this.#pending=Buffer.concat([this.#pending,chunk]);
    const messages=[];
    while(this.#pending.length>=4){
      const size=this.#pending.readUInt32BE(0);
      if(!size||size>MAX_FRAME)throw new Error('Frame size limit');
      if(this.#pending.length<size+4)break;
      messages.push(decodeJson(this.#pending.subarray(4,size+4)));
      this.#pending=this.#pending.subarray(size+4);
    }
    return messages;
  }
  finish() { if(this.#pending.length)throw new Error('Truncated frame'); }
}
export function encodeDatagram(value) {
  const bytes=Buffer.from(JSON.stringify(value),'utf8');
  if(bytes.length>MAX_DATAGRAM)throw new Error('Datagram size limit');
  return bytes;
}
export function decodeDatagram(bytes) {
  if(!bytes.length||bytes.length>MAX_DATAGRAM)throw new Error('Datagram size limit');
  return decodeJson(bytes);
}
function identity(x) { return typeof x==='string'&&/^[A-Za-z0-9:._-]{1,64}$/.test(x); }
export function checkedCommand(c) {
  if(!c||c.v!==1||c.kind!=='command'||!identity(c.session)||!identity(c.opId)||
    !Number.isSafeInteger(c.delta)||Math.abs(c.delta)>1000)throw new Error('Invalid command');
}
// Volatile single-process effect boundary. Transport ACKs do not persist it.
export class CommandLedger {
  #value=0;#results=new Map();
  get value(){return this.#value;}
  process(command){
    checkedCommand(command);
    const key=JSON.stringify([command.session,command.opId]);
    const old=this.#results.get(key);
    if(old){if(old.delta!==command.delta)throw new Error('Identity reused');return old.ack;}
    const next=this.#value+command.delta;
    if(!Number.isSafeInteger(next))throw new Error('Overflow');
    const ack=Object.freeze({v:1,kind:'ack',session:command.session,opId:command.opId,result:next});
    this.#value=next;this.#results.set(key,{delta:command.delta,ack});return ack;
  }
}
export class SnapshotTracker {
  #session;#newest=-1;value=null;
  constructor(session){if(!identity(session))throw new Error('Invalid session');this.#session=session;}
  accept(s){
    if(!s||s.session!==this.#session||!Number.isInteger(s.seq)||s.seq<0||s.seq>0xffffffff)throw new Error('Invalid snapshot');
    if(s.seq<=this.#newest)return false;
    this.#newest=s.seq;this.value=s.value;return true;
  }
}
