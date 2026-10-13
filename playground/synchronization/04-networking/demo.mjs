import {openTcpLedger,tcpExchange,udpRetryScenario} from './sockets.mjs';
import {SnapshotTracker} from './protocol.mjs';
const service=await openTcpLedger();
const command={v:1,kind:'command',session:'M-session',opId:'M:1',delta:1};
try{
  const first=await tcpExchange(service.port,[command]);
  const replay=await tcpExchange(service.port,[command]);
  console.log(`TCP application ACK: ${first[0].result}; replay on new connection: ${replay[0].result}; effects: ${service.ledger.value}`);
}finally{await service.close();}
const udp=await udpRetryScenario();
console.log(`UDP injected loss: request=${udp.droppedRequest}, ACK=${udp.droppedAck}; attempts=${udp.attempts}; effects=${udp.effects}`);
const tracker=new SnapshotTracker('match-1');
console.log(`snapshot 12 accepted=${tracker.accept({session:'match-1',seq:12,value:'new'})}; stale 11 accepted=${tracker.accept({session:'match-1',seq:11,value:'old'})}; view=${tracker.value}`);
