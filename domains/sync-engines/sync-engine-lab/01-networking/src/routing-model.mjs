import assert from 'node:assert/strict';
// IPv4 longest-prefix forwarding and fragment survival arithmetic, no raw IP.
const ipv4=s=>s.split('.').reduce((n,v)=>(n*256+Number(v))>>>0,0);
export function route(address,table) {
  const ip=ipv4(address);
  return table.filter(r=>{const mask=r.bits===0?0:(0xffffffff<<(32-r.bits))>>>0;return (ip&mask)>>>0===(ipv4(r.prefix)&mask)>>>0;}).sort((a,b)=>b.bits-a.bits)[0]?.next;
}
export function run() {
  const table=[{prefix:'0.0.0.0',bits:0,next:'default'},{prefix:'10.0.0.0',bits:8,next:'private'},{prefix:'10.2.0.0',bits:16,next:'specific'}];
  assert.equal(route('10.2.3.4',table),'specific');assert.equal(route('8.8.8.8',table),'default');
  const fragments=Math.ceil(4000/1400),p=0.1;
  return {route:route('10.2.3.4',table),fragments,independentAllFragmentsProbability:(1-p)**fragments};
}
if(process.argv[1]?.endsWith('/routing-model.mjs'))console.log(run());
