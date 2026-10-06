import assert from 'node:assert/strict';
// Segment-sized units for visible arithmetic, NOT TCP's byte sequence wire format.
// Models retransmission, receive buffering, flow/cwnd gates and delivery blocking.
export function run() {
  const receiver={next:1,buffer:new Map(),delivered:[]};
  const receive=(seq,value)=>{
    if(seq>=receiver.next)receiver.buffer.set(seq,value);
    while(receiver.buffer.has(receiver.next)) {
      receiver.delivered.push(receiver.buffer.get(receiver.next));receiver.buffer.delete(receiver.next++);
    }
    return receiver.next; // next expected sequence, a cumulative ACK boundary
  };
  const trace=[],sender={cwnd:2,rwnd:4,inflight:new Map([[1,'A'],[2,'B']])};
  const canSend=()=>sender.inflight.size<Math.min(sender.cwnd,sender.rwnd);
  trace.push({kind:'handshake',messages:['SYN(x)','SYN(y),ACK(x+1)','ACK(y+1)']});
  assert.equal(canSend(),false); // cwnd full
  const gapACK=receive(2,'B');assert.equal(gapACK,1);assert.deepEqual(receiver.delivered,[]);
  trace.push({kind:'receive-2-before-1',ack:gapACK,delivered:[...receiver.delivered]});
  // Modeled timeout triggers loss response and retransmission of the gap.
  sender.cwnd=1;const repairedACK=receive(1,'A');
  for(const seq of sender.inflight.keys())if(seq<repairedACK)sender.inflight.delete(seq);
  receive(1,'A');assert.deepEqual(receiver.delivered,['A','B']);
  trace.push({kind:'retransmit-1',ack:repairedACK,delivered:[...receiver.delivered],cwnd:sender.cwnd});
  sender.rwnd=0;assert.equal(canSend(),false);sender.rwnd=4;assert.equal(canSend(),true);
  return {trace,omissions:'No RTT estimator, SACK, actual congestion algorithm, SYN state machine or OS TCP compliance.'};
}
if(process.argv[1]?.endsWith('/transport-model.mjs'))console.log(JSON.stringify(run(),null,2));
