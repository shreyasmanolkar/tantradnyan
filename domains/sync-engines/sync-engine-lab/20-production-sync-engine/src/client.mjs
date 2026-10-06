import readline from 'node:readline';
import {SyncClient} from '../../shared/engine.mjs';
import {Store} from '../../shared/storage.mjs';
const actor=process.argv[2] || 'A';
const client=new SyncClient(actor,new Store('.data/client-'+actor+'.json'));
const url=process.env.SYNC_URL || 'ws://127.0.0.1:8080';
let ws,enabled=true,attempt=0,retryAt=0,lastPong=0,request=0;
function open() {
  if (!enabled || ws && [0,1].includes(ws.readyState)) return;
  ws=new WebSocket(url); const current=ws;
  ws.onopen=()=>{attempt=0;lastPong=Date.now();client.connect(body=>current.send(JSON.stringify(body)));console.log('online',client.view());};
  ws.onmessage=event=> {
    const body=JSON.parse(event.data);
    if (body.type==='pong') {lastPong=Date.now();return;}
    if (body.type==='error') {console.error('server rejection:',body.message);enabled=false;ws.close();return;}
    client.receive(body);console.log(JSON.stringify({cursor:client.data.cursor,pending:client.data.pending.length,view:client.view()}));
  };
  ws.onerror=()=>{};
  ws.onclose=()=>{client.disconnect();retryAt=Date.now()+Math.random()*Math.min(10000,250*2**Math.min(attempt++,8));console.log('disconnected; pending edits remain persisted');};
}
const timer=setInterval(()=> {
  if (ws?.readyState===1 && enabled) {
    if (Date.now()-lastPong>15000) {ws.close();return;}
    ws.send(JSON.stringify({type:'ping',requestID:actor+'-request-'+request++}));client.tick();
  } else if (Date.now()>=retryAt) open();
},1000);
console.log('Commands: set KEY JSON | show | offline | online | quit');
const input=readline.createInterface({input:process.stdin,output:process.stdout});
input.on('line',line=> {
  try {
    const [cmd,key,...rest]=line.trim().split(' ');
    if (cmd==='set') {client.mutate(key,JSON.parse(rest.join(' ')));client.tick();console.log('optimistic',client.view());}
    else if (cmd==='show') console.log(client.data,client.view());
    else if (cmd==='offline') {enabled=false;client.disconnect();ws?.close();}
    else if (cmd==='online') {enabled=true;retryAt=0;open();}
    else if (cmd==='quit') {enabled=false;clearInterval(timer);ws?.close();input.close();}
    else console.log('unknown command');
  } catch(e) {console.error(e.message);}
});
input.on('close',()=>{enabled=false;clearInterval(timer);ws?.close();});
open();
