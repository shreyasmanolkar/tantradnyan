import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {VersionedCell} from '../../shared/mechanisms.mjs';
export async function run() {
 const cell=new VersionedCell('A'),a=cell.read(),b=cell.read();
 assert.equal(cell.compareAndSet(a.version,'B'),true);assert.equal(cell.compareAndSet(b.version,'C'),false);
 cell.compareAndSet(1,'A');assert.equal(cell.compareAndSet(a.version,'D'),false);
 const word=new Int32Array(new SharedArrayBuffer(4));word[0]=1;const observed=Atomics.load(word,0);Atomics.store(word,0,2);Atomics.store(word,0,1);
 const abaSucceeded=Atomics.compareExchange(word,0,observed,9)===observed;assert.equal(abaSucceeded,true);
 return {cell:cell.read(),abaSucceeded};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
