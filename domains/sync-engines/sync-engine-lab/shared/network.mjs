// Discrete events ordered by (logical milliseconds, insertion sequence).
// This models application delivery, not TCP packet handling.
export class Network {
  constructor({seed = 7, latency = 500, jitter = 100, loss = 0.1, duplicate = 0.05} = {}) {
    if (![latency, jitter].every(x => x >= 0) || ![loss, duplicate].every(x => x >= 0 && x <= 1)) throw Error('invalid fault parameters');
    this.seed = seed >>> 0 || 1; this.now = 0; this.serial = 0;
    Object.assign(this, {latency, jitter, loss, duplicate});
    this.queue = []; this.handlers = new Map(); this.blocked = new Set(); this.trace = [];
  }
  random() { // xorshift32; repeatable, not cryptographically secure
    let x = this.seed; x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.seed = x >>> 0; return this.seed / 2 ** 32;
  }
  endpoint(name, handler) { this.handlers.set(name, handler); }
  at(delay, fn) { this.queue.push({time: this.now + delay, serial: this.serial++, fn}); }
  record(kind, from, to, body) { this.trace.push({time: this.now, kind, from, to, body: structuredClone(body)}); }
  send(from, to, body) {
    this.record('send', from, to, body);
    if (this.blocked.has(from) || this.blocked.has(to) || this.random() < this.loss) {
      this.record('drop', from, to, body); return;
    }
    const copies = this.random() < this.duplicate ? 2 : 1;
    for (let i = 0; i < copies; i++) {
      const payload = structuredClone(body);
      const delay = this.latency + Math.floor(this.random() * (this.jitter + 1));
      this.at(delay, () => {
        if (this.blocked.has(from) || this.blocked.has(to) || !this.handlers.has(to)) {
          this.record('unreachable', from, to, payload); return;
        }
        this.record('deliver', from, to, payload); this.handlers.get(to)(payload, from);
      });
    }
  }
  advance(ms, limit = 100000) {
    const end = this.now + ms; let events = 0;
    while (this.queue.length) {
      this.queue.sort((a,b) => a.time - b.time || a.serial - b.serial);
      if (this.queue[0].time > end) break;
      if (++events > limit) throw Error('event limit exceeded');
      const e = this.queue.shift(); this.now = e.time; e.fn();
    }
    this.now = end;
  }
}
