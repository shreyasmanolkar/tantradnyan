import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
export function project(events) {return events.reduce((s,e)=>{
 if(e.version!==1)throw Error('unknown event schema');
 if(e.type==='deposited')return s+e.amount;if(e.type==='withdrawn')return s-e.amount;throw Error('unknown event');
},0);}
export async function run() {
 const events=[{id:'1',version:1,type:'deposited',amount:10},{id:'2',version:1,type:'withdrawn',amount:3}];
 const balance=project(events);assert.equal(balance,7);assert.throws(()=>project([{...events[0],version:2}]),/schema/);
 return {events,balance,snapshotPlusTail:10+project(events.slice(1))};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(await run(),null,2));
