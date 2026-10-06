import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {VersionedCell} from '../../shared/mechanisms.mjs';
export async function run() {
 const base={x:0,y:0},a={...base,x:1},b={...base,y:1};let blind=a;blind=b;assert.equal(blind.x,0);
 const server=new VersionedCell(base),v=server.read().version;
 const accepted=[server.compareAndSet(v,a),server.compareAndSet(v,b)];assert.deepEqual(accepted,[true,false]);return {blind,accepted,versioned:server.read()};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
