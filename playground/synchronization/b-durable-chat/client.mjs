import {EventEmitter,once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {createInterface} from 'node:readline';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import WebSocket from 'ws';
import {cursor} from './repository.mjs';
export function projectPage(state,page){
  const next=cursor(page.nextCursor);
  if(!Array.isArray(page.entries)||page.entries.length>10||page.after!==state.seq||
    (state.epoch!==null&&state.epoch!==page.epoch)||next.epoch!==page.epoch)throw new Error('Page context mismatch');
  let expected=BigInt(state.seq);const seen=new Map(state.entries);
  for(const entry of page.entries){
    expected++;
    if(entry.seq!==expected.toString()||typeof entry.messageId!=='string'||typeof entry.body!=='string'||entry.channel!==page.channel)throw new Error('Noncontiguous page');
    if(seen.has(entry.seq)&&JSON.stringify(seen.get(entry.seq))!==JSON.stringify(entry))throw new Error('Conflicting sequence');
    seen.set(entry.seq,entry);
  }
  if(next.seq!==expected.toString()||typeof page.highWater!=='string'||!/^(0|[1-9][0-9]*)$/.test(page.highWater)||
    expected>BigInt(page.highWater)||page.hasMore!==(expected<BigInt(page.highWater)))throw new Error('Invalid high-water mark');
  return {epoch:page.epoch,seq:next.seq,entries:seen};
}
export class ChatClient extends EventEmitter{
  constructor(url,actor='M',position={epoch:null,seq:'0'}){
    super();const endpoint=new URL(url);
    if(endpoint.protocol!=='ws:'||endpoint.hostname!=='127.0.0.1'||!['M','D'].includes(actor))throw new Error('Loopback demo endpoint and actor required');
    this.state={...cursor(position),entries:new Map()};this.requests=new Map();this.channel=null;
    this.ws=new WebSocket(url,'chat.v1',{headers:{Authorization:`Bearer ${actor==='M'?'mira-demo':'dev-demo'}`},maxPayload:256*1024});
    this.ready=once(this.ws,'open');
    this.ws.on('error',()=>{});
    this.ws.on('message',raw=>{
      try{
        const frame=JSON.parse(raw.toString('utf8'));
        if(frame.v!==1)throw new Error('Unsupported protocol');
        if(frame.kind==='page'){
          this.state=projectPage(this.state,frame);this.emit('page',frame);
        }
        const pending=frame.requestId&&this.requests.get(frame.requestId);
        if(pending){clearTimeout(pending.timer);this.requests.delete(frame.requestId);
          if(frame.kind==='error')pending.reject(Object.assign(new Error(frame.code),{code:frame.code}));else pending.resolve(frame);
        }
        if(frame.kind==='error')this.emit('status',frame);
      }catch(error){this.emit('status',{kind:'protocol_error',code:error.message});this.ws.terminate();}
    });
    this.ws.on('close',()=>{
      for(const pending of this.requests.values()){clearTimeout(pending.timer);pending.reject(new Error('Connection closed; preserve operation identity for replay'));}
      this.requests.clear();this.emit('closed');
    });
  }
  get checkpoint(){return {epoch:this.state.epoch,seq:this.state.seq};}
  get entries(){return [...this.state.entries.values()];}
  async request(frame){
    await this.ready;const requestId=randomUUID();
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.requests.delete(requestId);reject(new Error('Unknown completion; retain identity'));},5000);
      this.requests.set(requestId,{resolve,reject,timer});
      this.ws.send(JSON.stringify({v:1,requestId,...frame}),error=>{
        if(error){clearTimeout(timer);this.requests.delete(requestId);reject(error);}
      });
    });
  }
  async subscribe(channel='general'){
    const result=await this.request({kind:'subscribe',channel,cursor:this.checkpoint});this.channel=channel;return result;
  }
  submit(opId,body,channel=this.channel||'general'){return this.request({kind:'submit',opId,body,channel});}
  async waitForCount(count,timeout=5000){
    if(this.entries.length>=count)return;
    await new Promise((resolve,reject)=>{
      const inspect=()=>{if(this.entries.length>=count){clearTimeout(timer);this.off('page',inspect);resolve();}};
      const timer=setTimeout(()=>{this.off('page',inspect);reject(new Error('Catch-up timeout'));},timeout);
      this.on('page',inspect);inspect();
    });
  }
  async close(){
    if(this.ws.readyState===WebSocket.CLOSED)return;
    const done=once(this.ws,'close');this.ws.terminate();await done;
  }
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const client=new ChatClient(process.argv[2]||'ws://127.0.0.1:8089/chat',process.argv[3]||'M');
  client.on('page',page=>{for(const entry of page.entries)console.log(JSON.stringify(entry));});
  client.on('status',event=>console.log(JSON.stringify(event)));
  await client.subscribe(process.argv[4]||'general');
  console.log('Type a message; /cursor prints the checkpoint; /quit closes. Local state is memory-only.');
  const input=createInterface({input:process.stdin,output:process.stdout});
  try{for await(const line of input){
    if(line==='/quit')break;
    if(line==='/cursor'){console.log(JSON.stringify(client.checkpoint));continue;}
    if(!line)continue;
    const opId=randomUUID();console.log(JSON.stringify({pending:opId,body:line}));
    try{console.log(JSON.stringify(await client.submit(opId,line)));}catch(error){console.log(JSON.stringify({error:error.message,replayOpId:opId}));}
  }}finally{input.close();await client.close();}
}
