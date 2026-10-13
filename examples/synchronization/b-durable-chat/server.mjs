import http from 'node:http';
import {once} from 'node:events';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {WebSocketServer,WebSocket} from 'ws';
import {createClient} from 'redis';
import {Repository,ProtocolError,identity,channelId,cursor} from './repository.mjs';
import {labConfig,checkedConfig} from './lab-config.mjs';
const tokens=new Map([['mira-demo','M'],['dev-demo','D']]);
const SUBPROTOCOL='chat.v1';
export async function startGateway(config,{port=0,pullMs=200,publish=true,crashBefore=null,crashAfter=null}={}){
  checkedConfig(config);
  if(!Number.isInteger(pullMs)||pullMs<50||pullMs>60000)throw new Error('Invalid pull interval');
  const repo=new Repository(config);await repo.pool.query(`SELECT channel_id FROM ${repo.p}channels LIMIT 1;`);
  const publisher=createClient({url:`redis://127.0.0.1:${config.redisPort}`,disableOfflineQueue:true,
    socket:{connectTimeout:2000,reconnectStrategy:false}});
  const subscriber=publisher.duplicate();publisher.on('error',()=>{});subscriber.on('error',()=>{});
  await publisher.connect();await subscriber.connect();
  const topic=`${config.schema}:wake`,connections=new Set(),tasks=new Set();let stopping=false,publishing=null;
  const track=promise=>{tasks.add(promise);promise.finally(()=>tasks.delete(promise)).catch(()=>{});return promise;};
  const send=(s,frame)=>{
    if(s.ws.readyState!==WebSocket.OPEN)return false;
    const bytes=JSON.stringify({v:1,...frame});
    if(s.ws.bufferedAmount+Buffer.byteLength(bytes)>256*1024){s.ws.close(1013,'resume from checkpoint');return false;}
    s.ws.send(bytes);return true;
  };
  async function pump(s){
    if(stopping||!s.channel||s.ws.readyState!==WebSocket.OPEN)return;
    if(s.pumping){s.dirty=true;return;}
    s.pumping=true;s.dirty=false;
    try{
      for(let n=0;n<4;n++){
        const page=await repo.page(s.user,s.channel,s.sentCursor);
        if(s.firstId||page.entries.length){
          if(!send(s,{kind:'page',requestId:s.firstId||null,...page}))return;
          s.firstId=null;s.sentCursor=page.nextCursor; // Volatile sent cursor, NOT a client durable checkpoint.
        }
        if(!page.hasMore)break;
        s.dirty=true;
      }
    }catch(e){
      const code=e instanceof ProtocolError?e.code:'RETRY_UNKNOWN';
      send(s,{kind:'error',requestId:s.firstId||null,code});
      if(e instanceof ProtocolError){s.channel=null;s.ws.close(1008,'subscription rejected');}
    }finally{
      s.pumping=false;
      if(s.dirty&&!stopping&&s.ws.readyState===WebSocket.OPEN)setImmediate(()=>track(pump(s)));
    }
  }
  const wake=channel=>{for(const s of connections)if(s.channel===channel)track(pump(s));};
  await subscriber.subscribe(topic,raw=>{
    try{const hint=JSON.parse(raw);if(channelId(hint.channel))wake(hint.channel);}catch{}
  });
  async function publishPending(){
    if(stopping||!publish||publishing)return;
    publishing=(async()=>{
      for(const item of await repo.pendingNotifications()){
        // Publish before marking. A crash between these steps causes a harmless repeated hint.
        await publisher.publish(topic,JSON.stringify({channel:item.channel}));
        await repo.markPublished(item.channel,item.seq);
      }
    })();
    try{await publishing;}catch{}finally{publishing=null;}
  }
  const server=http.createServer((request,response)=>{
    if(request.url==='/health'){response.writeHead(200,{'content-type':'application/json'});response.end('{"ok":true}');}
    else{response.writeHead(404);response.end();}
  });
  const wss=new WebSocketServer({noServer:true,maxPayload:32*1024,perMessageDeflate:false,
    handleProtocols:protocols=>protocols.has(SUBPROTOCOL)?SUBPROTOCOL:false});
  server.on('upgrade',(request,socket,head)=>{
    const deny=code=>{socket.end(`HTTP/1.1 ${code}\r\nConnection: close\r\n\r\n`);};
    const match=typeof request.headers.authorization==='string'&&request.headers.authorization.match(/^Bearer ([A-Za-z0-9-]+)$/);
    const user=match&&tokens.get(match[1]);
    if(!user)return deny('401 Unauthorized');
    if(request.url!=='/chat')return deny('404 Not Found');
    if(request.headers.origin&&!['http://127.0.0.1','http://localhost'].includes(request.headers.origin))return deny('403 Forbidden');
    if(!(request.headers['sec-websocket-protocol']||'').split(',').map(x=>x.trim()).includes(SUBPROTOCOL))return deny('400 Bad Request');
    if(connections.size>=32)return deny('503 Service Unavailable');
    wss.handleUpgrade(request,socket,head,ws=>wss.emit('connection',ws,user));
  });
  wss.on('connection',(ws,user)=>{
    const s={ws,user,channel:null,sentCursor:null,firstId:null,pumping:false,dirty:false,queue:Promise.resolve(),pending:0,tokens:40,refill:Date.now(),alive:true};
    connections.add(s);ws.on('error',()=>{});ws.on('pong',()=>s.alive=true);
    ws.on('close',()=>{connections.delete(s);});send(s,{kind:'hello',user,protocol:SUBPROTOCOL});
    ws.on('message',(bytes,binary)=>{
      if(binary){ws.close(1003,'text JSON required');return;}
      const now=Date.now();s.tokens=Math.min(40,s.tokens+(now-s.refill)*0.02);s.refill=now;
      if(s.tokens<1||s.pending>=32){ws.close(1013,'rate or queue limit');return;}
      s.tokens--;s.pending++;
      s.queue=s.queue.then(async()=>{
        let frame;
        try{
          frame=JSON.parse(bytes.toString('utf8'));
          if(!frame||frame.v!==1||!identity(frame.requestId))throw new ProtocolError('BAD_REQUEST');
          if(frame.kind==='subscribe'){
            if(Object.keys(frame).some(k=>!['v','kind','requestId','channel','cursor'].includes(k))||s.channel)throw new ProtocolError('BAD_REQUEST');
            if(!channelId(frame.channel))throw new ProtocolError('BAD_REQUEST');
            s.sentCursor=cursor(frame.cursor);s.channel=frame.channel;s.firstId=frame.requestId;await pump(s);
          }else if(frame.kind==='submit'){
            if(Object.keys(frame).some(k=>!['v','kind','requestId','opId','channel','body'].includes(k)))throw new ProtocolError('BAD_REQUEST');
            const result=await repo.submit(user,frame,{beforeCommit:async opId=>{if(opId===crashBefore)process.kill(process.pid,'SIGKILL');}});
            if(frame.opId===crashAfter)process.kill(process.pid,'SIGKILL');
            send(s,{kind:'accepted',requestId:frame.requestId,opId:frame.opId,...result});
          }else throw new ProtocolError('BAD_REQUEST');
        }catch(e){send(s,{kind:'error',requestId:identity(frame?.requestId)?frame.requestId:null,
          code:e instanceof ProtocolError?e.code:'RETRY_UNKNOWN'});}
      }).finally(()=>s.pending--);
      track(s.queue);
    });
  });
  const pullTimer=setInterval(()=>{for(const s of connections)track(pump(s));},pullMs);
  const outboxTimer=setInterval(()=>track(publishPending()),50);
  const heartbeat=setInterval(()=>{
    for(const s of connections){if(!s.alive)s.ws.terminate();else{s.alive=false;s.ws.ping();}}
  },10000);
  server.listen(port,'127.0.0.1');await once(server,'listening');
  return {url:`ws://127.0.0.1:${server.address().port}/chat`,repo,
    async close(){
      stopping=true;clearInterval(pullTimer);clearInterval(outboxTimer);clearInterval(heartbeat);
      for(const s of connections)s.ws.terminate();
      publisher.destroy();subscriber.destroy();
      await Promise.allSettled([...tasks]);
      await new Promise(r=>wss.close(r));await new Promise(r=>server.close(r));await repo.close();
    }};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const schema=process.env.CHAT_SCHEMA||'chat_demo';
  const config=process.env.CHAT_DB_PORT?checkedConfig({schema,dbPort:Number(process.env.CHAT_DB_PORT),redisPort:Number(process.env.CHAT_REDIS_PORT)}):await labConfig(schema);
  const gateway=await startGateway(config,{port:Number(process.env.CHAT_PORT||8089),pullMs:Number(process.env.CHAT_PULL_MS||200),
    publish:process.env.CHAT_PUBLISH!=='0',crashBefore:process.env.CHAT_CRASH_BEFORE_COMMIT_OP||null,crashAfter:process.env.CHAT_CRASH_AFTER_COMMIT_OP||null});
  const ready={kind:'ready',url:gateway.url};console.log(JSON.stringify(ready));if(process.send)process.send(ready);
  let closing=false;
  for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{if(closing)return;closing=true;await gateway.close();process.exit(0);});
}
