import assert from 'node:assert/strict';
// Delivery semantics model, not a QUIC, SCTP or WebRTC implementation.
export class Streams {
  constructor(shared=false) {this.shared=shared;this.expected=new Map();this.buffers=new Map();this.delivered=[];}
  receive(stream,seq,value) {
    const key=this.shared?'connection':stream;
    const buffer=this.buffers.get(key)||new Map();this.buffers.set(key,buffer);buffer.set(seq,{stream,seq,value});
    let expected=this.expected.get(key)||1;
    while(buffer.has(expected)){this.delivered.push(buffer.get(expected));buffer.delete(expected++);}this.expected.set(key,expected);
  }
}
export function run() {
  const tcp=new Streams(true),quic=new Streams(false);
  tcp.receive('doc',2,'later connection bytes');tcp.receive('cursor',3,'cursor');assert.equal(tcp.delivered.length,0);
  quic.receive('doc',2,'later stream bytes');quic.receive('cursor',1,'cursor');assert.equal(quic.delivered.length,1);
  tcp.receive('doc',1,'repair gap');quic.receive('doc',1,'repair stream gap');
  const unordered=[{seq:2,expires:100},{seq:1,expires:10}].filter(m=>m.expires>50);
  return {tcp:tcp.delivered,quic:quic.delivered,unorderedLimitedLifetime:unordered};
}
if(process.argv[1]?.endsWith('/channel-model.mjs'))console.log(run());
