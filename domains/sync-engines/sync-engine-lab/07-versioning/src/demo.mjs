import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {Lamport,HLC,vectorTick,vectorMerge,relation} from '../../shared/clocks.mjs';
export async function run() {
 const a=vectorTick({},'A'),b=vectorTick({},'B');assert.equal(relation(a,b),'concurrent');
 const s=vectorTick(vectorMerge(a,b),'S');assert.equal(relation(a,s),'before');
 const la=new Lamport(),ls=new Lamport();const send=la.tick(),receive=ls.tick(send);assert.ok(receive>send);
 const h=new HLC(),first=h.tick(1000),backward=h.tick(900);assert.ok(backward.p===1000&&backward.l>first.l);
 return {a,b,server:s,relation:relation(a,b),lamport:[send,receive],hlc:[first,backward]};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
