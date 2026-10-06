import assert from 'node:assert/strict';
import {Network} from '../../shared/network.mjs';
import {SyncServer,SyncClient} from '../../shared/engine.mjs';
import {Store} from '../../shared/storage.mjs';
export function scenario({seed=7,clients=3,loss=0.1,duplicate=0.05,latency=500,jitter=500} = {}) {
  const net = new Network({seed,loss,duplicate,latency,jitter});
  const disk = new Store(); let server = new SyncServer(disk);
  const replicas = Array.from({length:clients},(_,i) => new SyncClient('C'+i));
  const broadcast = body => replicas.forEach(c => net.send('S',c.data.actor,body));
  net.endpoint('S',(body,from) => server.receive(body,from,(to,msg) => net.send('S',to,msg),broadcast));
  replicas.forEach(c => {
    net.endpoint(c.data.actor,body => {if (c.connected) c.receive(body);});
    c.connect(body => net.send(c.data.actor,'S',body));
    c.mutate('shared',c.data.actor); c.mutate('own_'+c.data.actor,1);
  });
  const offline = replicas.at(-1); offline.disconnect(); net.blocked.add(offline.data.actor);
  offline.mutate('offline','persisted while disconnected');
  net.at(6000,() => {server=new SyncServer(disk);net.record('server-restart','S','S',{head:server.data.seq});});
  net.at(10000,() => {server.compact();net.record('compact','S','S',{base:server.data.base});});
  net.at(30000,() => {
    net.blocked.delete(offline.data.actor);
    offline.connect(body => net.send(offline.data.actor,'S',body));
    net.record('reconnect',offline.data.actor,'S',{});
  });
  for (let t=0;t<45000;t+=1000) {replicas.forEach(c => c.tick());net.advance(1000);}
  // A finite random run cannot promise eventual delivery. End with an explicit
  // fair, loss-free recovery window. Delays and duplicate injection continue.
  net.loss=0;
  for (let i=0;i<100;i++) {
    replicas.forEach(c => c.tick());net.advance(1000);
    if (replicas.every(c => !c.data.pending.length && c.data.cursor === server.data.seq)) break;
  }
  const canonical = Object.fromEntries(Object.entries(server.data.state).map(([k,r]) => [k,r.value]));
  replicas.forEach(c => {assert.deepEqual(c.view(),canonical);assert.equal(c.data.pending.length,0);assert.equal(c.data.cursor,server.data.seq);});
  assert.equal(server.data.seq,clients*2+1);
  return {seed,clients,head:server.data.seq,state:canonical,conflicts:Object.values(server.data.receipts).filter(e => e.conflict).length,drops:net.trace.filter(e => e.kind==='drop').length,deliveries:net.trace.filter(e => e.kind==='deliver').length,trace:net.trace};
}
