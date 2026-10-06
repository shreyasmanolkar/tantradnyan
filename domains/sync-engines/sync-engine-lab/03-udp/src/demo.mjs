import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import dgram from 'node:dgram';
import {once} from 'node:events';
export async function run() {
 const receiver=dgram.createSocket('udp4'),sender=dgram.createSocket('udp4');let newest=0;const delivered=[];
 receiver.bind(0,'127.0.0.1');await once(receiver,'listening');
 const done=new Promise(resolve=>receiver.on('message',b=>{const m=JSON.parse(b);delivered.push(m.seq);newest=Math.max(newest,m.seq);if(delivered.length===4)resolve();}));
 // Sequence 2 is omitted; 3 is duplicated; 1 arrives after newer data.
 for(const seq of [3,1,3,4])await new Promise((r,j)=>sender.send(Buffer.from(JSON.stringify({seq})),receiver.address().port,'127.0.0.1',e=>e?j(e):r()));
 await done;sender.close();receiver.close();assert.equal(newest,4);return {delivered,newest};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
