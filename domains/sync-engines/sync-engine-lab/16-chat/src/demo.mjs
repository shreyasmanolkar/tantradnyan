import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {SyncServer,SyncClient} from '../../shared/engine.mjs';
export async function run() {
 const s=new SyncServer(),a=new SyncClient('A'),op=a.mutate('message_1',{text:'hello'});s.accept(op);s.accept(op);
 const typing={A:{expires:3000}},present=t=>Object.keys(typing).filter(k=>typing[k].expires>t);
 let read=0;for(const cursor of [5,3,5,7])read=Math.max(read,cursor);
 assert.equal(s.data.seq,1);assert.deepEqual(present(4000),[]);assert.equal(read,7);
 return {history:s.data.state,typingAt1000:present(1000),typingAt4000:present(4000),readCursor:read};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
