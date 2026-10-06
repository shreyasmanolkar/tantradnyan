import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {gIncrement,gMerge,gValue} from '../../shared/crdt.mjs';
import {merkle,merkleDiff} from '../../shared/mechanisms.mjs';
export async function run() {
 let a=gIncrement({},'A',2),b=gIncrement({},'B',3);const delta={A:a.A};
 b=gMerge(gMerge(b,delta),delta);assert.equal(gValue(b),5);
 let naive=3;naive+=2;naive+=2;assert.equal(naive,7);
 const differing=merkleDiff(merkle({a:1,b:2,c:3,d:4}),merkle({a:1,b:9,c:3,d:4}));assert.deepEqual(differing,['b']);
 return {replica:b,value:gValue(b),duplicateAdditivePatch:naive,merkleDiff:differing};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
