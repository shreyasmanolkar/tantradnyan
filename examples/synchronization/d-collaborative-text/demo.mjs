import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import {startServer} from './server.mjs';import {EditorClient,waitFor} from './client.mjs';
const dir=await mkdtemp(join(tmpdir(),'sync-text-demo-'));let server,m,d;
try{
 server=await startServer(join(dir,'server.sqlite'));m=new EditorClient('M');d=new EditorClient('D');await m.connect(server.url);await d.connect(server.url);
 await m.disconnect();await d.disconnect();m.insert(5,' Mira');d.insert(5,' Dev');
 console.log(`offline: Mira=${JSON.stringify(m.value())}; Dev=${JSON.stringify(d.value())}`);
 await m.connect(server.url);await m.flush();await d.connect(server.url);await d.flush();await waitFor(()=>m.value()===d.value());
 console.log(`merged: both contain Mira and Dev; equal=${m.value()===d.value()}`);
 m.undo();await m.flush();await waitFor(()=>m.value()===d.value());console.log(`selective undo: ${JSON.stringify(d.value())}`);
}finally{await m?.close();await d?.close();await server?.close();await rm(dir,{recursive:true,force:true});}
