import {scenario} from '../src/scenario.mjs';
import {run as ot} from '../../13-ot/src/demo.mjs';
import {run as text} from '../../17-collaborative-editor/src/demo.mjs';
import {run as game} from '../../19-server-authoritative-game/src/demo.mjs';
import assert from 'node:assert/strict';
const variants=[
  ['combined',{seed:7}],
  ['loss-free-500ms',{seed:7,loss:0,duplicate:0,latency:500,jitter:0}],
  ['reordering',{seed:11,loss:0,duplicate:0,jitter:2000}],
  ['10-percent-loss',{seed:13,loss:0.1,duplicate:0}],
  ['5-percent-duplicates',{seed:17,loss:0,duplicate:0.05}],
  ['100-writers',{seed:20,clients:100}]
];
for(const [name,options] of variants) {
  const {trace,...result}=scenario(options);
  const lifecycle=trace.filter(e=>['server-restart','compact','reconnect'].includes(e.kind));
  const firstDeliveries=trace.filter(e=>e.kind==='deliver').slice(0,5).map(e=>({time:e.time,from:e.from,to:e.to,type:e.body.type,seq:e.body.entry?.seq}));
  console.log(JSON.stringify({name,options,result,lifecycle,firstDeliveries}));
}
const transformed=await ot(),replicated=await text();assert.equal(transformed.finalA,replicated.merged);
console.log(JSON.stringify({name:'OT-versus-text-CRDT',ot:transformed.finalA,crdt:replicated.merged,scope:'two concurrent edits from same ABC base'}));
console.log(JSON.stringify({name:'authoritative-game',result:await game()}));
