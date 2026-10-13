import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {startServer} from './server.mjs';
import {OfflineClient} from './client.mjs';
const [command,path,actor,value,extra]=process.argv.slice(2);
if(!command||!path)throw new Error('Usage: node cli.mjs serve FILE [PORT] | enqueue FILE M|D title|increment|delete VALUE | sync FILE M|D URL | show FILE M|D | resolve FILE M|D OP_ID discard|title [TITLE]');
mkdirSync(dirname(path),{recursive:true});
if(command==='serve'){
  const service=await startServer(path,{port:Number(actor??8088),fault:process.env.LAB_FAULT});
  console.log(service.url);process.send?.({url:service.url});
  process.on('SIGTERM',async()=>{await service.close();process.exit(0);});process.on('SIGINT',async()=>{await service.close();process.exit(0);});
}else{
  const client=new OfflineClient(path,actor);
  try {
    const kill=()=>process.kill(process.pid,'SIGKILL');
    if(command==='enqueue')console.log(client.enqueue(value,value==='increment'?Number(extra):extra,{beforeCommit:process.env.LAB_FAULT==='before-enqueue'?kill:undefined,afterCommit:process.env.LAB_FAULT==='after-enqueue'?kill:undefined}));
    else if(command==='sync')console.log(JSON.stringify(await client.synchronize(value,{fault:process.env.LAB_FAULT})));
    else if(command==='show')console.log(JSON.stringify({meta:client.meta(),confirmed:client.confirmed(),view:client.view(),pending:client.pending(),receipts:client.receipts()},null,2));
    else if(command==='resolve')console.log(client.resolve(value,extra,process.argv[7]));
    else throw new Error('Unknown command');
  }finally{client.close();}
}
