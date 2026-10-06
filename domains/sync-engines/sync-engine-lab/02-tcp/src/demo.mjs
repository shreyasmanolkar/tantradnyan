import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import net from 'node:net';
import {once} from 'node:events';
import {encode,Decoder} from '../../shared/framing.mjs';
export async function run() {
 const received=[],decoder=new Decoder(m=>received.push(m));
 const bytes=Buffer.concat([encode({text:'λ'}),encode({n:2})]);
 for(const byte of bytes)decoder.push(Buffer.from([byte]));
 assert.deepEqual(received,[{text:'λ'},{n:2}]);
 const server=net.createServer(s=>{const d=new Decoder(m=>s.write(encode({echo:m})));s.on('data',b=>d.push(b));});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const client=net.connect(server.address().port,'127.0.0.1');await once(client,'connect');
 const echo=await new Promise((resolve,reject)=>{const d=new Decoder(resolve);client.on('error',reject);client.on('data',b=>d.push(b));client.write(encode({n:3}));});
 client.end();await once(client,'close');await new Promise(r=>server.close(r));
 assert.deepEqual(echo,{echo:{n:3}});return {fragmented:received,loopback:echo};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
