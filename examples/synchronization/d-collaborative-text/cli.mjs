import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {createInterface} from 'node:readline';
import {startServer} from './server.mjs';
import {EditorClient} from './client.mjs';
const [command,arg,extra]=process.argv.slice(2);
if(command==='serve'){
 const path=arg??'data/server.sqlite';mkdirSync(dirname(path),{recursive:true});
 const service=await startServer(path,{port:Number(extra??8087),fault:process.env.LAB_FAULT});console.log(service.url);process.send?.({url:service.url});
 const stop=async()=>{await service.close();process.exit(0);};process.on('SIGTERM',stop);process.on('SIGINT',stop);
}else if(command==='client'){
 const editor=new EditorClient(arg??'M'),url=extra??'ws://127.0.0.1:8087/document';await editor.connect(url);
 console.log('Commands: insert INDEX TEXT; delete INDEX LENGTH; undo; redo; cursor INDEX; show; offline; online; flush; quit. Indices are UTF-16 code units.');
 editor.on('change',value=>console.log(JSON.stringify(value)));editor.on('protocol-error',code=>console.log(`provider error: ${code}; private branch retained only in memory`));
 editor.on('presence',()=>console.log('peers',JSON.stringify([...editor.peers].map(([id,p])=>({session:id,actor:p.actor,index:editor.resolve(p.anchor)})))));
 console.log(JSON.stringify(editor.value()));
 const lines=createInterface({input:process.stdin,output:process.stdout});
 for await(const line of lines){
  try{
   const insert=line.match(/^insert (\d+) (.+)$/),del=line.match(/^delete (\d+) (\d+)$/);
   if(insert)editor.insert(Number(insert[1]),insert[2]);else if(del)editor.delete(Number(del[1]),Number(del[2]));
   else if(line==='undo')editor.undo();else if(line==='redo')editor.redo();else if(line.startsWith('cursor '))editor.presence(Number(line.slice(7)));
   else if(line==='offline')await editor.disconnect();else if(line==='online')await editor.connect(url);else if(line==='flush')await editor.flush();
   else if(line==='show')console.log(JSON.stringify({text:editor.value(),role:editor.role,pending:editor.pending.size}));
   else if(line==='quit'){lines.close();break;}else console.log('Unknown command');
  }catch(error){console.log(error.message);}
 }
 if(editor.pending.size)console.log(`Discarding ${editor.pending.size} memory-only pending update blobs on exit`);await editor.close();
}else throw new Error('Usage: node cli.mjs serve [FILE] [PORT] | client M|D|V [URL]');
