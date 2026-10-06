import {pathToFileURL} from 'node:url';
import {SyncServer} from '../../shared/engine.mjs';
import {Store} from '../../shared/storage.mjs';
import {websocketServer} from '../../shared/websocket.mjs';
export async function start({port=8080,path='.data/server.json'} = {}) {
  const engine = new SyncServer(new Store(path)), peers=new Set();
  const server=websocketServer(peer => {
    peers.add(peer);peer.onclose=() => peers.delete(peer);
    peer.onmessage=message => {
      try {engine.receive(message,peer,(p,msg)=>p.send(msg),msg=>peers.forEach(p=>p.send(msg)));}
      catch(e) {peer.send({type:'error',message:e.message});peer.close();}
    };
  });
  await new Promise((resolve,reject) => {server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return {server,engine,peers,port:server.address().port,close:async() => {
    for (const peer of peers) peer.close();
    await new Promise(resolve=>server.close(resolve));
  }};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app=await start({port:Number(process.env.SYNC_PORT || 8080),path:process.env.SYNC_STORE || '.data/server.json'});
  console.log('sync server ws://127.0.0.1:'+app.port+' (one authority; process-restart persistence)');
  process.on('SIGINT',async()=>{await app.close();process.exit(0);});
}
