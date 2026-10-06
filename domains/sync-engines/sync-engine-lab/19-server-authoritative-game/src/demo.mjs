import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {GameServer,reconcile} from '../../shared/mechanisms.mjs';
export async function run() {
 const server=new GameServer(),one={seq:1,dx:1},two={seq:2,dx:1};server.input(two);assert.equal(server.ack,0);
 server.input(one);server.input(one);assert.equal(server.x,2);assert.equal(server.ack,2);
 assert.throws(()=>server.input({seq:3,dx:100}),/invalid/);
 const local=reconcile(server.snapshot(),[{seq:1,dx:1},{seq:2,dx:1},{seq:3,dx:-1}]);assert.equal(local,1);
 return {server:server.snapshot(),reconciledPrediction:local};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
