import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import * as c from '../../shared/crdt.mjs';
export async function run() {
 let base=c.textEmpty(),left=null;
 for(const [i,char] of [...'ABC'].entries()){const tag=[i+1,'S'];base=c.textInsert(base,tag,left,char);left=c.textID(tag);}
 const a=c.textInsert(base,[4,'A'],c.textID([1,'S']),'X'),b=c.textRemove(base,c.textID([2,'S']));
 const merged=c.textMerge(a,b);assert.equal(c.textValue(merged),'AXC');
 assert.equal(c.textValue(c.textMerge(b,a)),'AXC');return {localA:c.textValue(a),localB:c.textValue(b),merged:c.textValue(merged),nodes:merged.nodes,removed:merged.removed};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
