import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {SyncServer,SyncClient} from '../../shared/engine.mjs';
import {Store} from '../../shared/storage.mjs';
export async function run() {
 const disk=new Store(),first=new SyncClient('A',disk);first.mutate('title','offline');
 const restarted=new SyncClient('A',disk),server=new SyncServer();assert.equal(restarted.view().title,'offline');
 const entry=server.accept(restarted.data.pending[0]).entry;server.compact();
 restarted.receive(server.sync(0,restarted.data.pending.map(o=>o.id)));
 assert.equal(restarted.data.pending.length,0);assert.equal(restarted.data.cursor,entry.seq);return {client:restarted.view(),cursor:restarted.data.cursor,mode:'snapshot'};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
