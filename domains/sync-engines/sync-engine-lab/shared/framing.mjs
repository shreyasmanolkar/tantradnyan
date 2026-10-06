export const MAX_FRAME = 65536;
export function encode(value) {
  const body = Buffer.from(JSON.stringify(value));
  if (body.length > MAX_FRAME) throw Error('frame too large');
  const head = Buffer.alloc(4); head.writeUInt32BE(body.length);
  return Buffer.concat([head,body]);
}
export class Decoder {
  constructor(onMessage) { this.buffer = Buffer.alloc(0); this.onMessage = onMessage; }
  push(chunk) {
    this.buffer = Buffer.concat([this.buffer,chunk]);
    while (this.buffer.length >= 4) {
      const n = this.buffer.readUInt32BE(0);
      if (n > MAX_FRAME) throw Error('frame too large');
      if (this.buffer.length < 4+n) return;
      const body = this.buffer.subarray(4,4+n); this.buffer = this.buffer.subarray(4+n);
      this.onMessage(JSON.parse(body.toString('utf8')));
    }
  }
}
