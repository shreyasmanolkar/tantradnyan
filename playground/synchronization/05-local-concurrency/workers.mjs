import {isMainThread,parentPort,workerData,Worker} from 'node:worker_threads';
import assert from 'node:assert/strict';
import {setImmediate as nextTurn} from 'node:timers/promises';
if(!isMainThread){
 const shared=new Int32Array(workerData.shared);
 if(workerData.mode==='add')for(let i=0;i<5000;i++)Atomics.add(shared,0,1);
 else if(workerData.mode==='publication'){
  parentPort.postMessage('waiting');while(Atomics.load(shared,1)!==1)Atomics.wait(shared,1,0);assert.equal(shared[0],42);
 }else throw new Error('Unknown worker mode');
 parentPort.postMessage('done');
}else{
 const worker=(mode,shared)=>{
  const instance=new Worker(new URL(import.meta.url),{workerData:{mode,shared}});
  let completed=false;const promise=new Promise((resolve,reject)=>{
   instance.on('message',m=>{if(m==='done')completed=true;});instance.on('error',reject);
   instance.on('exit',code=>code===0&&completed?resolve():reject(new Error(`worker exit ${code}`)));
  });return {instance,promise};
 };
 const run=async(mode,shared,n,afterStart=()=>{})=>{
  const workers=Array.from({length:n},()=>worker(mode,shared));
  let timer;try{
   afterStart(workers);await Promise.race([Promise.all(workers.map(w=>w.promise)),new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('WORKER_TIMEOUT')),5000))]);
  }finally{clearTimeout(timer);await Promise.all(workers.map(w=>w.instance.terminate()));}
 };
 const count=new SharedArrayBuffer(4);await run('add',count,4);assert.equal(new Int32Array(count)[0],20000);console.log('PASS four workers atomically add 20000 shared increments');
 const published=new SharedArrayBuffer(8),cells=new Int32Array(published);
 await run('publication',published,1,workers=>{workers[0].instance.on('message',message=>{if(message==='waiting'){cells[0]=42;Atomics.store(cells,1,1);Atomics.notify(cells,1);}});});console.log('PASS atomic flag publication exposes ordinary shared payload');
 let value=0;const increment=async()=>{const before=value;await nextTurn();value=before+1;};await Promise.all([increment(),increment()]);assert.equal(value,1);console.log('PASS one event loop still loses a logical update across await');
 console.log('JavaScript scenarios passed: 3');
}
