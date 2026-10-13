import http from 'node:http';
import {Authority} from './authority.mjs';
import {ProtocolError} from './storage.mjs';
export async function startServer(path,{port=0,fault}={}) {
  const authority=new Authority(path);
  const server=http.createServer(async(req,res)=>{
    try {
      if(req.method!=='POST'||!['/pull','/submit'].includes(req.url))throw new ProtocolError('NOT_FOUND');
      // Public fixture tokens, only for the loopback lab. No browser Origin accepted.
      if(req.headers.origin)throw new ProtocolError('FORBIDDEN');
      const actor={'Bearer mira-demo':'M','Bearer dev-demo':'D'}[req.headers.authorization];
      if(!actor)throw new ProtocolError('UNAUTHENTICATED');
      let bytes=0;const chunks=[];
      for await(const chunk of req){bytes+=chunk.length;if(bytes>65536)throw new ProtocolError('TOO_LARGE');chunks.push(chunk);}
      let input;try{input=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ProtocolError('BAD_JSON');}
      const kill=()=>process.kill(process.pid,'SIGKILL');
      const result=req.url==='/pull'?authority.pull(actor,input):authority.submit(actor,input,{beforeCommit:fault==='before-server-commit'?kill:undefined,afterCommit:fault==='after-server-commit'?kill:undefined});
      res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(result));
    } catch(error) {
      const code=error instanceof ProtocolError?error.code:'RETRY_UNKNOWN';
      const status=code==='UNAUTHENTICATED'?401:code==='FORBIDDEN'?403:code==='RETRY_UNKNOWN'?503:400;
      if(!res.destroyed){res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify({error:code}));}
    }
  });
  server.requestTimeout=5000;server.headersTimeout=5000;server.maxConnections=32;
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return {authority,url:`http://127.0.0.1:${server.address().port}`,close:async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));authority.close();}};
}
