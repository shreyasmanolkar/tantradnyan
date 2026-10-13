import http from 'node:http';
export async function startProxy(target,{plan=[]}={}){
 const destination=new URL(target);if(destination.protocol!=='http:'||destination.hostname!=='127.0.0.1'||destination.pathname!=='/'||destination.username||destination.password||destination.search||destination.hash)throw new Error('LOOPBACK_TARGET_REQUIRED');
 const rules=plan.map(x=>({...x,used:0})),stats={requests:0,forwards:0,captured:0,droppedBefore:0,droppedAfter:0,duplicates:0};const active=new Set();let partitioned=false;
 const server=http.createServer(async(req,res)=>{
  const abort=new AbortController();active.add(abort);
  try{
   if(req.method!=='POST'||!['/pull','/submit'].includes(req.url)){res.writeHead(400);res.end();return;}
   let size=0;const chunks=[];for await(const c of req){size+=c.length;if(size>65536)throw new Error('BODY_LIMIT');chunks.push(c);}const body=Buffer.concat(chunks);
   stats.requests++;const rule=rules.find(x=>x.path===req.url&&x.used<(x.times??1));if(rule)rule.used++;
   if(partitioned||rule?.mode==='drop-before'){stats.droppedBefore++;res.destroy();return;}
   const forward=async()=>{stats.forwards++;const response=await fetch(destination.origin+req.url,{method:'POST',headers:{authorization:req.headers.authorization??'','content-type':'application/json'},body,signal:AbortSignal.any([abort.signal,AbortSignal.timeout(3000)]),redirect:'error'});let bytes=0;const chunks=[];for await(const part of response.body){bytes+=part.length;if(bytes>262144)throw new Error('RESPONSE_LIMIT');chunks.push(part);}return {status:response.status,body:Buffer.concat(chunks)};};
   const response=await forward();stats.captured++;if(rule?.mode==='duplicate'){await forward();stats.duplicates++;}
   if(rule?.mode==='drop-after'){stats.droppedAfter++;res.destroy();return;}
   if(rule?.mode==='delay')await new Promise(r=>setTimeout(r,Math.min(250,Math.max(0,rule.delayMs??50))));
   if(!res.destroyed){res.writeHead(response.status,{'content-type':'application/json','cache-control':'no-store'});res.end(response.body);}
  }catch{if(!res.destroyed){res.writeHead(503,{'content-type':'application/json'});res.end('{"error":"RETRY_UNKNOWN"}');}}
  finally{active.delete(abort);}
 });
 server.requestTimeout=4000;server.headersTimeout=4000;server.maxConnections=16;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 return {url:`http://127.0.0.1:${server.address().port}`,stats,partition:value=>{partitioned=!!value;},close:async()=>{for(const c of active)c.abort();server.closeAllConnections();await new Promise(r=>server.close(r));}};
}
