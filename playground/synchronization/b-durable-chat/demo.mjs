import {randomUUID} from 'node:crypto';
import {labConfig} from './lab-config.mjs';
import {Repository} from './repository.mjs';
import {startGateway} from './server.mjs';
import {ChatClient} from './client.mjs';
const config=await labConfig('chat_lab_'+randomUUID().replaceAll('-',''));
const repo=new Repository(config);let a,b,mira,dev;
try{
  await repo.init();a=await startGateway(config);b=await startGateway(config);
  mira=new ChatClient(a.url,'M');dev=new ChatClient(b.url,'D');await Promise.all([mira.subscribe(),dev.subscribe()]);
  const first=await mira.submit('M:demo','Hello Dev');await dev.waitForCount(1);
  const replay=await mira.submit('M:demo','Hello Dev');
  console.log(`committed sequence=${first.entry.seq}; replay same ID=${first.entry.messageId===replay.entry.messageId}`);
  const checkpoint=dev.checkpoint;await dev.close();
  await mira.submit('M:second','While Dev is offline');
  dev=new ChatClient(b.url,'D',checkpoint);await dev.subscribe();await dev.waitForCount(1);
  console.log(`reconnected after ${checkpoint.seq}; received only missing sequence=${dev.entries[0].seq}`);
  console.log(`database messages=${(await repo.stats('general')).messages}`);
}finally{
  await Promise.allSettled([mira?.close(),dev?.close()]);await Promise.allSettled([a?.close(),b?.close()]);
  try{await repo.drop();}finally{await repo.close();}
}
