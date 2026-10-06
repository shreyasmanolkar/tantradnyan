import http from 'node:http';
import {once} from 'node:events';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
// Same replay cursor through polling, long polling and SSE, actual HTTP/1.1.
export async function run() {
  const log=[],waiting=new Set();
  const publish=value=>{const event={seq:log.length+1,value};log.push(event);for(const f of [...waiting])f();};
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://localhost'),after=Number(url.searchParams.get('after')||0);
    const entries=()=>log.filter(e=>e.seq>after);
    if(url.pathname==='/poll') {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(entries()));}
    else if(url.pathname==='/long') {
      let timer;const reply=()=>{waiting.delete(reply);clearTimeout(timer);res.setHeader('Content-Type','application/json');res.end(JSON.stringify(entries()));};
      if(entries().length)reply();else{waiting.add(reply);timer=setTimeout(reply,1000);res.on('close',()=>{waiting.delete(reply);clearTimeout(timer);});}
    } else if(url.pathname==='/events') {
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache'});
      // Finite teaching stream. EventSource would reconnect with Last-Event-ID.
      for(const e of entries())res.write('id: '+e.seq+'\ndata: '+JSON.stringify(e)+'\n\n');res.end();
    } else {res.writeHead(404);res.end();}
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  try {
    publish('first');const poll=await (await fetch(base+'/poll?after=0')).json();
    const long=fetch(base+'/long?after=1');setTimeout(()=>publish('second'),20);
    const longResult=await (await long).json();
    const sse=await (await fetch(base+'/events?after=1')).text();
    assert.equal(poll[0].seq,1);assert.equal(longResult[0].seq,2);assert.match(sse,/id: 2/);
    return {poll,longPoll:longResult,sse};
  } finally {server.closeIdleConnections();await new Promise(r=>server.close(r));}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)console.log(await run());
