export const vectorMerge = (a,b) => Object.fromEntries([...new Set([...Object.keys(a), ...Object.keys(b)])].sort().map(k => [k, Math.max(a[k] || 0, b[k] || 0)]));
export const vectorTick = (v, actor) => ({...v, [actor]: (v[actor] || 0) + 1});
export function relation(a,b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const le = [...keys].every(k => (a[k] || 0) <= (b[k] || 0));
  const ge = [...keys].every(k => (a[k] || 0) >= (b[k] || 0));
  return le && ge ? 'equal' : le ? 'before' : ge ? 'after' : 'concurrent';
}
export class Lamport {
  constructor() { this.n = 0; }
  tick(remote = 0) { this.n = Math.max(this.n, remote) + 1; return this.n; }
}
export class HLC {
  constructor() { this.p = 0; this.l = 0; }
  tick(wall, remote = {p: 0, l: 0}) {
    const p = Math.max(wall, this.p, remote.p);
    const l = p === this.p && p === remote.p ? Math.max(this.l, remote.l) + 1
      : p === this.p ? this.l + 1 : p === remote.p ? remote.l + 1 : 0;
    this.p = p; this.l = l; return {p,l};
  }
}
