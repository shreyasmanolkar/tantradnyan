import http from 'node:http';
import {WebSocketServer,WebSocket} from 'ws';
import * as Y from 'yjs';
import {DocumentStore} from './store.mjs';
import {binary,b64,shape} from './protocol.mjs';
export async function startServer(path,{port=0,presenceMs=15000,fault}={}){
 const store=new DocumentStore(path),httpServer=http.createServer((req,res)=>{res.writeHead(404);res.end();});
 const wss=new WebSocketServer({noServer:true,maxPayload:131072,perMessageDeflate:false,handleProtocols:p=>p.has('text.v1')?'text.v1':false});
 const sessions=new Set();let nextSession=1;
 const send=(session,message)=>{if(session.socket.readyState!==WebSocket.OPEN)return;if(session.socket.bufferedAmount>524288){session.socket.close(1013,'resume required');return;}session.socket.send(JSON.stringify(message));};
 const readable=s=>['read','write'].includes(store.role(s.actor));
 const broadcast=(message,except)=>{for(const s of sessions){if(!readable(s)){s.socket.close(1008,'revoked');continue;}if(s!==except)send(s,message);}};
 httpServer.on('upgrade',(req,socket,head)=>{
  const actor={'Bearer mira-demo':'M','Bearer dev-demo':'D','Bearer viewer-demo':'V'}[req.headers.authorization];
  const status=!actor?401:!['read','write'].includes(store.role(actor))?403:req.url!=='/document'||req.headers.origin||!req.headers['sec-websocket-protocol']?.split(',').map(x=>x.trim()).includes('text.v1')?400:sessions.size>=32?503:null;
  if(status){socket.end(`HTTP/1.1 ${status} Rejected\r\nConnection: close\r\n\r\n`);return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req,actor));
 });
 wss.on('connection',(socket,req,actor)=>{
  const session={socket,actor,id:String(nextSession++),presence:null,expires:0,alive:true,tokens:80,last:Date.now()};sessions.add(session);
  send(session,{type:'snapshot',v:1,...store.meta(),update:b64(Y.encodeStateAsUpdate(store.doc)),vector:b64(Y.encodeStateVector(store.doc)),role:store.role(actor),session:session.id});
  for(const peer of sessions)if(peer.presence&&peer.expires>Date.now())send(session,{type:'presence',session:peer.id,actor:peer.actor,anchor:peer.presence});
  socket.on('pong',()=>session.alive=true);
  socket.on('message',raw=>{
   try{
    const now=Date.now();session.tokens=Math.min(80,session.tokens+(now-session.last)*0.02);session.last=now;if(session.tokens<1)throw new Error('RATE_LIMIT');session.tokens--;
    if(!readable(session))throw new Error('FORBIDDEN');
    const message=JSON.parse(raw.toString());if(message.v!==1)throw new Error('UPGRADE_REQUIRED');
    if(message.type==='update'){
     shape(message,['type','v','epoch','id','update']);const data=binary(message.update,65536);
     const kill=()=>process.kill(process.pid,'SIGKILL');
     const result=store.accept(actor,message.epoch,message.id,data,{beforeCommit:fault==='before-commit'?kill:undefined,afterCommit:fault==='after-commit'?kill:undefined});
     send(session,{type:'ack',id:message.id,epoch:store.meta().epoch,seq:result.seq,replay:result.replay});
     if(!result.replay)broadcast({type:'update',epoch:store.meta().epoch,seq:result.seq,update:message.update},session);
    }else if(message.type==='presence'){
     shape(message,['type','v','anchor']);const data=binary(message.anchor,256);const position=Y.decodeRelativePosition(data);
     const absolute=Y.createAbsolutePositionFromRelativePosition(position,store.doc);
     if(!absolute||absolute.type!==store.doc.getText('body'))throw new Error('BAD_ANCHOR');
     session.presence=message.anchor;session.expires=now+presenceMs;broadcast({type:'presence',session:session.id,actor,anchor:message.anchor},session);
    }else throw new Error('BAD_TYPE');
   }catch(error){send(session,{type:'error',code:error.message});socket.close(1008,'invalid or forbidden update');}
  });
  socket.on('error',()=>{});
  socket.on('close',()=>{sessions.delete(session);broadcast({type:'presence-remove',session:session.id});});
 });
 const timer=setInterval(()=>{const now=Date.now();for(const session of sessions){if(!readable(session)){session.socket.close(1008,'revoked');continue;}if(session.presence&&session.expires<=now){session.presence=null;broadcast({type:'presence-remove',session:session.id});}if(!session.alive){session.socket.terminate();continue;}session.alive=false;session.socket.ping();}},Math.min(5000,presenceMs));
 try{await new Promise((resolve,reject)=>{httpServer.once('error',reject);httpServer.listen(port,'127.0.0.1',resolve);});}catch(error){clearInterval(timer);store.close();throw error;}
 return {store,url:`ws://127.0.0.1:${httpServer.address().port}/document`,close:async()=>{clearInterval(timer);for(const s of sessions)s.socket.terminate();await new Promise(r=>wss.close(r));httpServer.closeAllConnections();await new Promise(r=>httpServer.close(r));store.close();}};
}
