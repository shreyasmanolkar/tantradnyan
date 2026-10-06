import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {round} from '../../shared/ot.mjs';
export async function run() {
 const result=round('ABC',{id:'A:1',type:'insert',pos:1,char:'X'},{id:'B:1',type:'delete',pos:1});
 assert.equal(result.finalA,'AXC');assert.equal(result.finalA,result.finalB);return result;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
