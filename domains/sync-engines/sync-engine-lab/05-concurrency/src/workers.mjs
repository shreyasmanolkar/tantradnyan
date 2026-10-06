import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import assert from 'node:assert/strict';
// Two real threads are forced to read the same initial count before writing.
if(!isMainThread) {
  const words=new Int32Array(workerData.buffer),old=Atomics.load(words,0);
  parentPort.postMessage('ready');Atomics.wait(words,1,0);
  if(workerData.safe)Atomics.add(words,0,1);else Atomics.store(words,0,old+1);
  parentPort.postMessage('done');
}
export async function experiment(safe) {
  const buffer=new SharedArrayBuffer(8),words=new Int32Array(buffer),workers=[];
  const ready=[],done=[];
  for(let i=0;i<2;i++) {
    const worker=new Worker(new URL(import.meta.url),{workerData:{buffer,safe}});workers.push(worker);
    ready.push(new Promise((resolve,reject)=>{worker.once('error',reject);worker.on('message',m=>{if(m==='ready')resolve();});}));
    done.push(new Promise((resolve,reject)=>{worker.once('error',reject);worker.once('exit',code=>code===0?resolve():reject(Error('worker exit '+code)));}));
  }
  await Promise.all(ready);Atomics.store(words,1,1);Atomics.notify(words,1,2);await Promise.all(done);return words[0];
}
if(isMainThread && process.argv[1]?.endsWith('/workers.mjs')) {
  const unsafe=await experiment(false),atomic=await experiment(true);assert.equal(unsafe,1);assert.equal(atomic,2);console.log({unsafe,atomic});
}
