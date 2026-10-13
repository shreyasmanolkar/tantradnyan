import net from 'node:net';
import dgram from 'node:dgram';
import { once } from 'node:events';
import { FrameDecoder,encodeFrame,decodeDatagram,encodeDatagram,CommandLedger } from './protocol.mjs';
export async function openTcpLedger(ledger=new CommandLedger()){
  const sockets=new Set();
  const server=net.createServer(socket=>{
    sockets.add(socket);socket.on('close',()=>sockets.delete(socket));
    socket.on('error',()=>{});socket.setTimeout(3000,()=>socket.destroy());
    const decoder=new FrameDecoder();
    socket.on('data',chunk=>{
      try{
        for(const command of decoder.push(chunk)){
          if(socket.writableLength>64*1024)throw new Error('Slow consumer');
          if(!socket.write(encodeFrame(ledger.process(command))))socket.pause();
        }
      }catch{socket.destroy();}
    });
    socket.on('drain',()=>socket.resume());
    socket.on('end',()=>{try{decoder.finish();}catch{socket.destroy();}});
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  return {port:server.address().port,ledger,
    async close(){for(const socket of sockets)socket.destroy();await new Promise(r=>server.close(r));}};
}
export function tcpExchange(port,commands){
  return new Promise((resolve,reject)=>{
    if(!commands.length){reject(new Error('Commands required'));return;}
    const socket=net.createConnection({host:'127.0.0.1',port});
    const decoder=new FrameDecoder(),acks=[];let finished=false;
    const timer=setTimeout(()=>done(new Error('TCP response timeout')),3000);
    function done(error){if(finished)return;finished=true;clearTimeout(timer);socket.destroy();error?reject(error):resolve(acks);}
    socket.on('error',done);
    socket.on('close',()=>{if(!finished)done(new Error('Closed before all application ACKs'));});
    socket.on('data',chunk=>{
      try{
        for(const ack of decoder.push(chunk))acks.push(ack);
        if(acks.length===commands.length)done();
        else if(acks.length>commands.length)done(new Error('Extra ACKs'));
      }catch(error){done(error);}
    });
    socket.on('connect',()=>{
      const bytes=Buffer.concat(commands.map(encodeFrame));
      // Two writes are not promised to become two reads or two packets.
      socket.write(bytes.subarray(0,3));socket.write(bytes.subarray(3));
    });
  });
}
export async function udpRetryScenario({requestLoss=true,ackLoss=true,maxAttempts=5,timeoutMs=100}={}){
  if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>5||!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>1000)throw new Error('Invalid lab retry bounds');
  const server=dgram.createSocket('udp4'),client=dgram.createSocket('udp4');
  const ledger=new CommandLedger();let arrivals=0,attempts=0,droppedRequest=false,droppedAck=false;
  const command={v:1,kind:'command',session:'M-session',opId:'M:1',delta:1};
  try{
    server.bind(0,'127.0.0.1');await once(server,'listening');
    client.bind(0,'127.0.0.1');await once(client,'listening');
    const port=server.address().port;
    // Faults are injected at application send/receive boundaries, not the kernel.
    server.on('message',(bytes,peer)=>{
      arrivals++;
      if(requestLoss&&!droppedRequest){droppedRequest=true;return;}
      try{
        const ack=ledger.process(decodeDatagram(bytes));
        if(ackLoss&&!droppedAck){droppedAck=true;return;}
        server.send(encodeDatagram(ack),peer.port,peer.address);
      }catch{}
    });
    const ack=await new Promise((resolve,reject)=>{
      let timer,settled=false;
      const done=(error,value)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(value);};
      server.once('error',done);client.once('error',done);
      client.on('message',(bytes,peer)=>{
        if(peer.port!==port||peer.address!=='127.0.0.1')return;
        try{
          const ack=decodeDatagram(bytes);
          if(ack.v===1&&ack.kind==='ack'&&ack.session===command.session&&ack.opId===command.opId&&Number.isSafeInteger(ack.result))done(null,ack);
        }catch{}
      });
      const send=()=>{
        if(attempts>=maxAttempts){
          const error=new Error('Retry budget exhausted; effect may have happened');
          error.observedEffects=ledger.value; // Test-only server inspection, unavailable to a real disconnected client.
          done(error);return;
        }
        attempts++;client.send(encodeDatagram(command),port,'127.0.0.1',error=>{if(error)done(error);});
        timer=setTimeout(send,timeoutMs*2**(attempts-1));
      };
      send();
    });
    return {attempts,arrivals,effects:ledger.value,ack,droppedRequest,droppedAck};
  }finally{
    for(const socket of [client,server]){
      try{socket.close();await once(socket,'close');}catch{}
    }
  }
}
