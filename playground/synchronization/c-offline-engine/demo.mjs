import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startServer} from './server.mjs';
import {OfflineClient} from './client.mjs';
const dir=await mkdtemp(join(tmpdir(),'sync-offline-demo-'));let service,m,d;
try {
  service=await startServer(join(dir,'server.sqlite'));
  m=new OfflineClient(join(dir,'m.sqlite'),'M');d=new OfflineClient(join(dir,'d.sqlite'),'D');
  await m.synchronize(service.url);await d.synchronize(service.url);
  m.enqueue('title','Plan');m.enqueue('increment',2);
  d.enqueue('title','Proposal');d.enqueue('increment',3);
  console.log(`offline: Mira=${m.view().title}/${m.view().count}; Dev=${d.view().title}/${d.view().count}`);
  await d.synchronize(service.url);service.authority.prune();await m.synchronize(service.url);
  console.log(`reconnected: title=${m.confirmed().title}; count=${m.confirmed().count}; Mira conflicts=${m.pending().filter(x=>x.status==='conflict').length}`);
  const conflict=m.pending().find(x=>x.status==='conflict');m.resolve(conflict.operation.opId,'title','Plan + Proposal');
  await m.synchronize(service.url);await d.synchronize(service.url);
  console.log(`resolved: both=${d.confirmed().title}/${d.confirmed().count}; Mira pending=${m.pending().length}`);
}finally{m?.close();d?.close();await service?.close();await rm(dir,{recursive:true,force:true});}
