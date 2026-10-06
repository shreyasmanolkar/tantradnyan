import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {Mutex} from '../../shared/mechanisms.mjs';
export async function run() {
 let value=0;
 const unsafe=async()=>{const old=value;await Promise.resolve();value=old+1;};
 await Promise.all([unsafe(),unsafe()]);const lost=value;assert.equal(lost,1);
 value=0;const lock=new Mutex();const safe=()=>lock.withLock(async()=>{const old=value;await Promise.resolve();value=old+1;});
 await Promise.all([safe(),safe()]);assert.equal(value,2);
 const shared=new Int32Array(new SharedArrayBuffer(4));Atomics.add(shared,0,1);Atomics.add(shared,0,1);assert.equal(Atomics.load(shared,0),2);
 return {lost,locked:value,atomic:shared[0]};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
