import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {Network} from '../../shared/network.mjs';
export async function run() {
 const net=new Network({seed:7,latency:500,jitter:500,loss:0.1,duplicate:0.05});const delivered=[];
 net.endpoint('B',m=>delivered.push(m.seq));
 for(let seq=1;seq<=20;seq++) net.send('A','B',{seq});
 net.advance(2000);assert.ok(delivered.length>0);
 return {delivered,trace:net.trace};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
