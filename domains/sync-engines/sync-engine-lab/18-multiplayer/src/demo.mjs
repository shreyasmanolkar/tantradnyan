import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {gameStep,reconcile,interpolate} from '../../shared/mechanisms.mjs';
export async function run() {
 const pending=[{seq:1,dx:1},{seq:2,dx:1},{seq:3,dx:-1}],snapshot={x:1,ack:1};
 const predicted=reconcile(snapshot,pending),rendered=interpolate({t:0,x:0},{t:100,x:10},50);
 const guessed=[1,1,1],actual=[1,-1,1];const simulate=inputs=>inputs.reduce(gameStep,0);
 const before=simulate(guessed),after=simulate(actual);assert.equal(predicted,1);assert.equal(rendered,5);assert.equal(after,1);
 return {predicted,rendered,rollback:{before,after},lockstep:simulate(actual)};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
