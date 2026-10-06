import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {SyncServer,SyncClient} from '../../shared/engine.mjs';
export async function run() {
 const s=new SyncServer(),a=new SyncClient('A'),op=a.mutate('x',1);
 const first=s.accept(op),retry=s.accept(op);assert.equal(retry.duplicate,true);assert.equal(s.data.seq,1);
 const second=s.accept({...op,id:'A:2',counter:2,key:'y'}).entry;
 a.receive({type:'entry',entry:second});assert.equal(a.data.cursor,0);
 a.receive({type:'entry',entry:first.entry});assert.equal(a.data.cursor,2);
 return {head:s.data.seq,retryDuplicate:retry.duplicate,client:a.view()};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
