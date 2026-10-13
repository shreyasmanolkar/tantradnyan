import {createInterface} from 'node:readline';import {startServer} from './server.mjs';import {GameClient} from './client.mjs';
const [mode,arg]=process.argv.slice(2);
if(mode==='serve'){
 const service=await startServer({port:Number(arg??8086)});console.log(JSON.stringify({port:service.address.port,epoch:service.world.epoch,tickMs:50}));process.send?.({port:service.address.port,epoch:service.world.epoch});
 const stop=async()=>{await service.close();process.exit(0);};process.on('SIGTERM',stop);process.on('SIGINT',stop);
}else if(mode==='client'){
 const actor=arg??'M',port=Number(process.argv[4]??8086),client=new GameClient(actor);await client.connect(port);
 console.log('Commands: left, right, neutral, show, reconnect, quit. Each direction submits ONE fixed-step input, not held movement. Units: mm.');
 const show=()=>console.log(JSON.stringify({tick:client.core.tick,ack:client.core.ack,confirmed:client.core.confirmed,predicted:client.core.predicted,pending:client.core.pending.size,remote:client.remote(actor==='M'?'D':'M')}));
 client.on('state',show);const lines=createInterface({input:process.stdin,output:process.stdout});
 for await(const line of lines){try{if(line==='left')client.input(-1);else if(line==='right')client.input(1);else if(line==='neutral')client.input(0);else if(line==='show')show();else if(line==='reconnect'){await client.disconnect();await client.connect(port);}else if(line==='quit'){lines.close();break;}else console.log('Unknown command');}catch(error){console.log(error.message);}}
 await client.close();
}else throw new Error('Usage: node cli.mjs serve [PORT] | client M|D [PORT]');
