import assert from 'node:assert/strict';
import {Network} from '../../shared/network.mjs';
import {backoff} from '../../shared/mechanisms.mjs';
// Selective ACK/retry over unreliable application datagram delivery, NOT a full
// secure/congestion-controlled reliable UDP protocol.
export function run() {
  const net=new Network({seed:31,latency:100,jitter:200,loss:0.3,duplicate:0.2});
  const pending=new Map(),seen=new Set(),effects=[];
  net.endpoint('B',packet=>{
    if(!seen.has(packet.id)){seen.add(packet.id);effects.push(packet.value);}
    net.send('B','A',{ack:packet.id}); // ACK again for every duplicate
  });
  net.endpoint('A',packet=>pending.delete(packet.ack));
  for(let i=1;i<=5;i++)pending.set('A:'+i,{id:'A:'+i,value:i,attempt:0,due:0});
  for(let time=0;time<30000 && pending.size;time+=100) {
    if(time===10000)net.loss=0; // explicit fair recovery, not a probabilistic proof
    for(const p of pending.values())if(net.now>=p.due) {
      net.send('A','B',{id:p.id,value:p.value});p.due=net.now+100+backoff(p.attempt++,net.random(),200,2000);
    }
    net.advance(100);
  }
  assert.equal(pending.size,0);assert.equal(effects.length,5);assert.deepEqual([...effects].sort(),[1,2,3,4,5]);
  return {effects,pending:pending.size,trace:net.trace.slice(0,20),scope:'Unordered reliable effects with in-memory dedup; no crash persistence, congestion estimator or ordering layer.'};
}
if(process.argv[1]?.endsWith('/reliable-model.mjs'))console.log(JSON.stringify(run(),null,2));
