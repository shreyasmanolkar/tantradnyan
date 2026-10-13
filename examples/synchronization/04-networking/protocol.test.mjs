import test from 'node:test';
import assert from 'node:assert/strict';
import {FrameDecoder,encodeFrame,MAX_FRAME,encodeDatagram,decodeDatagram,CommandLedger,SnapshotTracker} from './protocol.mjs';
import {openTcpLedger,tcpExchange,udpRetryScenario} from './sockets.mjs';
const command={v:1,kind:'command',session:'M-session',opId:'M:1',delta:1};
test('TCP decoder preserves messages for every possible two-chunk split',()=>{
  const messages=[command,{label:'😀 multi-byte UTF-8'},[1,2,3]];
  const bytes=Buffer.concat(messages.map(encodeFrame));
  for(let i=0;i<=bytes.length;i++){
    const d=new FrameDecoder();const got=[...d.push(bytes.subarray(0,i)),...d.push(bytes.subarray(i))];
    d.finish();assert.deepEqual(got,messages);
  }
});
test('one-byte fragments and coalesced frames retain application boundaries',()=>{
  const bytes=Buffer.concat([encodeFrame(command),encodeFrame({value:2})]);
  const d=new FrameDecoder(),got=[];for(const byte of bytes)got.push(...d.push(Buffer.from([byte])));
  d.finish();assert.deepEqual(got,[command,{value:2}]);
});
test('oversized length rejected before waiting for advertised body',()=>{
  const header=Buffer.alloc(4);header.writeUInt32BE(MAX_FRAME+1);
  assert.throws(()=>new FrameDecoder().push(header),/size limit/);
});
test('truncated stream is not treated as a complete JSON message',()=>{
  const bytes=encodeFrame(command),d=new FrameDecoder();d.push(bytes.subarray(0,-1));
  assert.throws(()=>d.finish(),/Truncated/);
});
test('malformed UTF-8 and invalid JSON frames are rejected',()=>{
  const header=Buffer.alloc(4);header.writeUInt32BE(1);
  assert.throws(()=>new FrameDecoder().push(Buffer.concat([header,Buffer.from([0xff])])));
  assert.throws(()=>new FrameDecoder().push(Buffer.concat([header,Buffer.from('{')])));
});
test('datagram codec retains one whole message and enforces the lab size bound',()=>{
  assert.deepEqual(decodeDatagram(encodeDatagram(command)),command);
  assert.throws(()=>encodeDatagram({x:'x'.repeat(1200)}),/size limit/);
});
test('command replay returns original outcome after another operation',()=>{
  const ledger=new CommandLedger();assert.equal(ledger.process(command).result,1);
  assert.equal(ledger.process({...command,opId:'M:2'}).result,2);
  assert.equal(ledger.process(command).result,1);assert.equal(ledger.value,2);
  assert.throws(()=>ledger.process({...command,delta:7}),/reused/);
});
test('memory ledger restart demonstrates the durability gap',()=>{
  const before=new CommandLedger();before.process(command);
  const after=new CommandLedger();after.process(command);
  assert.equal(before.value+after.value,2); // The identity had one effect in each lost-memory incarnation.
});
test('bad versions and unbounded command deltas are rejected',()=>{
  const ledger=new CommandLedger();assert.throws(()=>ledger.process({...command,v:2}),/Invalid/);
  assert.throws(()=>ledger.process({...command,delta:Infinity}),/Invalid/);
});
test('snapshot sequence applies only newer values in one declared session',()=>{
  const s=new SnapshotTracker('match-1');
  assert.equal(s.accept({session:'match-1',seq:12,value:'new'}),true);
  assert.equal(s.accept({session:'match-1',seq:11,value:'old'}),false);
  assert.equal(s.accept({session:'match-1',seq:12,value:'duplicate'}),false);
  assert.equal(s.value,'new');
  assert.throws(()=>s.accept({session:'match-2',seq:13,value:'other'}),/Invalid/);
});
test('real loopback TCP reconnect reuses application identity while server state survives',async()=>{
  const service=await openTcpLedger();
  try{
    assert.equal((await tcpExchange(service.port,[command]))[0].result,1);
    assert.equal((await tcpExchange(service.port,[command]))[0].result,1);
    assert.equal(service.ledger.value,1);
  }finally{await service.close();}
});
test('real loopback UDP retry survives injected request and ACK loss with one memory effect',async()=>{
  const r=await udpRetryScenario();assert.ok(r.attempts>=3);assert.equal(r.effects,1);
  assert.equal(r.droppedRequest,true);assert.equal(r.droppedAck,true);assert.equal(r.ack.result,1);
});
test('finite UDP retry budget can fail even after an effect was applied',async()=>{
  await assert.rejects(udpRetryScenario({requestLoss:false,ackLoss:true,maxAttempts:1,timeoutMs:100}),error=>{
    assert.match(error.message,/effect may have happened/);assert.equal(error.observedEffects,1);return true;
  });
});
