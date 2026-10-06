import http from 'node:http';
import {createHash} from 'node:crypto';
// Bounded RFC 6455 subset: masked client text frames, fragmented text messages,
// ping/pong and close; no extensions, compression, TLS or origin/auth policy.
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX = 65535;
function frame(opcode,payload) {
  const b = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  if (b.length > MAX) throw Error('message too large');
  const h = Buffer.alloc(b.length < 126 ? 2 : 4); h[0] = 0x80|opcode;
  if (b.length < 126) h[1] = b.length; else { h[1] = 126; h.writeUInt16BE(b.length,2); }
  return Buffer.concat([h,b]);
}
export function websocketServer(onConnection) {
  const server = http.createServer((req,res) => {res.writeHead(426);res.end('WebSocket upgrade required');});
  server.on('upgrade',(req,socket,head) => {
    if (req.method !== 'GET' || req.headers.upgrade?.toLowerCase() !== 'websocket' || req.headers['sec-websocket-version'] !== '13' || !req.headers['sec-websocket-key'] || Buffer.from(req.headers['sec-websocket-key'],'base64').length !== 16) {socket.destroy();return;}
    const accept = createHash('sha1').update(req.headers['sec-websocket-key']+GUID).digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
    let buffer = Buffer.alloc(0), fragments = [], fragmentBytes = 0, continuing = false;
    const peer = {onmessage:() => {},onclose:() => {},
      send(value) {
        // Slow subscribers reconnect and repair from their cursor.
        if (socket.writableLength > 1024*1024) {socket.destroy();return;}
        socket.write(frame(1,JSON.stringify(value)));
      },close:() => socket.end(frame(8,Buffer.alloc(0)))};
    socket.on('close',() => peer.onclose()); socket.on('error',() => socket.destroy());
    function consume(chunk) {
      try {
        buffer = Buffer.concat([buffer,chunk]);
        while (buffer.length >= 2) {
          const fin = !!(buffer[0]&128), opcode = buffer[0]&15, masked = !!(buffer[1]&128);
          let n = buffer[1]&127, offset = 2;
          if (buffer[0]&112 || !masked || n === 127) throw Error('unsupported frame');
          if (n === 126) {if (buffer.length < 4) return;n=buffer.readUInt16BE(2);offset=4;}
          if (n > MAX || (opcode >= 8 && (!fin || n > 125))) throw Error('invalid frame length');
          if (buffer.length < offset+4+n) return;
          const mask = buffer.subarray(offset,offset+4), body = Buffer.from(buffer.subarray(offset+4,offset+4+n));
          buffer = buffer.subarray(offset+4+n);
          for (let i=0;i<body.length;i++) body[i] ^= mask[i%4];
          if (opcode === 8) {socket.end(frame(8,body));return;}
          if (opcode === 9) {socket.write(frame(10,body));continue;}
          if (opcode === 10) continue;
          if (opcode !== 0 && opcode !== 1 || opcode === 0 && !continuing || opcode === 1 && continuing) throw Error('invalid opcode/fragment order');
          fragments.push(body); fragmentBytes += body.length;
          if (fragmentBytes > MAX) throw Error('fragmented message too large');
          continuing = !fin;
          if (fin) {
            const text = new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(fragments));
            fragments=[];fragmentBytes=0;
            peer.onmessage(JSON.parse(text));
          }
        }
      } catch {socket.destroy();}
    }
    socket.on('data',consume); onConnection(peer); if (head.length) consume(head);
  });
  return server;
}
