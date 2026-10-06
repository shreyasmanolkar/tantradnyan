import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {once} from 'node:events';
import {websocketServer} from '../../shared/websocket.mjs';
export async function run() {
 const server=websocketServer(p=>{p.onmessage=m=>p.send({echo:m});});server.listen(0,'127.0.0.1');await once(server,'listening');
 const ws=new WebSocket('ws://127.0.0.1:'+server.address().port);await once(ws,'open');
 const response=new Promise(r=>ws.addEventListener('message',e=>r(JSON.parse(e.data)),{once:true}));ws.send(JSON.stringify({operation:'insert'}));
 const result=await response;ws.close();await once(ws,'close');await new Promise(r=>server.close(r));
 assert.deepEqual(result,{echo:{operation:'insert'}});return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
