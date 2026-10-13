import { lww, emptyOR, addTag, removeObserved, mergeOR, tags, canonicalOR } from '../01-math-conflicts/model.mjs';
export { lww, emptyOR, addTag, removeObserved, mergeOR, tags, canonicalOR };
function actor(x) { if (typeof x !== 'string' || !/^[A-Za-z]+$/.test(x)) throw new Error('Invalid actor'); }
function value(x) { if (x !== null && typeof x !== 'string' && typeof x !== 'boolean' &&
  !(typeof x === 'number' && Number.isFinite(x))) throw new Error('Expected finite JSON scalar'); }
function positive(x) { if (typeof x !== 'bigint' || x <= 0n) throw new Error('Expected positive bigint'); }
export function union(a,b) { return new Set([...a,...b]); }
export function gAdd(state,x) { value(x); return new Set([...state,x]); }
export function empty2P() { return { adds:new Set(), removed:new Set() }; }
export function twoPAdd(state,x) {
  value(x); if(state.removed.has(x)) throw new Error('Cannot re-add a removed 2P element');
  return { adds:gAdd(state.adds,x), removed:new Set(state.removed) };
}
export function twoPRemove(state,x) {
  if(!state.adds.has(x)) throw new Error('Remove requires observed member');
  return { adds:new Set(state.adds), removed:union(state.removed,new Set([x])) };
}
export function merge2P(a,b) { return { adds:union(a.adds,b.adds), removed:union(a.removed,b.removed) }; }
export function twoPValues(s) { return [...s.adds].filter(x=>!s.removed.has(x)); }
export function emptyG() { return new Map(); }
export function gInc(s,writer,delta=1n) {
  actor(writer); positive(delta); const out=new Map(s); out.set(writer,(s.get(writer)||0n)+delta); return out;
}
export function mergeG(a,b) {
  const out=new Map(a); for(const [writer,count] of b) out.set(writer, count>(out.get(writer)||0n)?count:(out.get(writer)||0n));
  return out;
}
export function gValue(s) { return [...s.values()].reduce((a,b)=>a+b,0n); }
export function emptyPN() { return { p:emptyG(), n:emptyG() }; }
export function pnInc(s,writer,delta=1n) { return { p:gInc(s.p,writer,delta), n:new Map(s.n) }; }
export function pnDec(s,writer,delta=1n) { return { p:new Map(s.p), n:gInc(s.n,writer,delta) }; }
export function mergePN(a,b) { return { p:mergeG(a.p,b.p), n:mergeG(a.n,b.n) }; }
export function pnValue(s) { return gValue(s.p)-gValue(s.n); }

// Causally closed state-based dot/context MV register. Each actor has one writer.
export function emptyMV() { return { entries:new Map(), context:new Map() }; }
function covers(context,entry) { return (context.get(entry.actor)||0)>=entry.counter; }
function checkEntry(e) {
  actor(e.actor); value(e.value);
  if(!Number.isSafeInteger(e.counter)||e.counter<1||e.id!==`${e.actor}:${e.counter}`) throw new Error('Invalid dot');
}
export function mvAssign(s,writer,x) {
  actor(writer); value(x); const counter=(s.context.get(writer)||0)+1;
  if(!Number.isSafeInteger(counter)) throw new Error('Dot overflow');
  const entry=Object.freeze({actor:writer,counter,id:`${writer}:${counter}`,value:x});
  const context=new Map(s.context);context.set(writer,counter);
  return { entries:new Map([[entry.id,entry]]),context };
}
export function mergeMV(a,b) {
  const entries=new Map();
  for(const [left,right] of [[a,b],[b,a]]) for(const [id,e] of left.entries) {
    checkEntry(e); if(!covers(left.context,e)) throw new Error('Dot missing from own context');
    const peer=right.entries.get(id);
    if(peer&&(peer.actor!==e.actor||peer.counter!==e.counter||!Object.is(peer.value,e.value))) throw new Error('Dot reused');
    if(peer||!covers(right.context,e)) entries.set(id,e);
  }
  const context=new Map(a.context);
  for(const [writer,n] of b.context) context.set(writer,Math.max(n,context.get(writer)||0));
  return { entries,context };
}
export function mvValues(s) { return [...s.entries.values()].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).map(e=>e.value); }

// Fixed-key map of LWW cells. Deletion is a retained cell, not Map.delete.
function joinCell(a,b) {
  if(a.stamp===b.stamp&&a.actor===b.actor&&a.id===b.id&&a.deleted!==b.deleted) throw new Error('Cell identity reused');
  return lww(a,b);
}
export function mapWrite(s,key,entry,deleted=false) {
  if(typeof key!=='string'||!key) throw new Error('Invalid key');
  const cell={...entry,deleted:!!deleted}; lww(cell,cell);
  if(cell.deleted&&cell.value!==null) throw new Error('Deletion cell must have null payload');
  const out=new Map(s); out.set(key,s.has(key)?joinCell(s.get(key),cell):cell);return out;
}
export function mergeMap(a,b) {
  let out=new Map(a); for(const [key,cell] of b) out=mapWrite(out,key,cell,cell.deleted); return out;
}
export function mapValues(s) { return Object.fromEntries([...s].filter(([,cell])=>!cell.deleted).map(([k,cell])=>[k,cell.value])); }

// Educational anchor tree: retained insertion records and delete IDs, not a production RGA.
export function emptySeq() { return { nodes:new Map(), removed:new Set() }; }
function checkNode(n) {
  actor(n.actor);
  if(!Number.isSafeInteger(n.clock)||n.clock<1||n.id!==`${n.actor}:${n.clock}`) throw new Error('Invalid sequence identity');
  if(n.after!==null&&(typeof n.after!=='string'||!/^[A-Za-z]+:[1-9][0-9]*$/.test(n.after))) throw new Error('Invalid anchor');
  if(n.after===n.id) throw new Error('Self anchor');
  if(typeof n.text!=='string'||[...n.text].length!==1) throw new Error('Expected one Unicode scalar');
  const point=n.text.codePointAt(0);
  if(point>=0xd800&&point<=0xdfff) throw new Error('Lone surrogate');
}
function checkEdges(nodes) {
  for(const n of nodes.values()) {
    const parent=nodes.get(n.after);
    if(parent&&n.clock<=parent.clock) throw new Error('Anchor must precede child Lamport clock');
  }
}
export function receiveNode(s,node) {
  checkNode(node); const old=s.nodes.get(node.id);
  if(old&&(old.actor!==node.actor||old.clock!==node.clock||old.after!==node.after||old.text!==node.text)) throw new Error('Sequence identity reused');
  const nodes=new Map(s.nodes);nodes.set(node.id,Object.freeze({...node}));checkEdges(nodes);
  return {nodes,removed:new Set(s.removed)};
}
export function seqInsert(s,writer,after,text) {
  actor(writer); if(after!==null&&!s.nodes.has(after)) throw new Error('Local insertion needs known anchor');
  const clock=[...s.nodes.values()].reduce((max,n)=>Math.max(max,n.clock),0)+1;
  const node={actor:writer,clock,id:`${writer}:${clock}`,after,text};
  return {state:receiveNode(s,node),node};
}
export function seqDelete(s,ids) {
  if(!Array.isArray(ids)||ids.some(id=>typeof id!=='string'||!/^[A-Za-z]+:[1-9][0-9]*$/.test(id))) throw new Error('Invalid deletion IDs');
  return { nodes:new Map(s.nodes),removed:union(s.removed,new Set(ids)) };
}
export function mergeSeq(a,b) {
  let out={nodes:new Map(a.nodes),removed:union(a.removed,b.removed)};
  for(const node of b.nodes.values()) out=receiveNode(out,node);return out;
}
export function seqView(s) {
  const children=new Map();
  for(const n of s.nodes.values()) {
    if(!children.has(n.after))children.set(n.after,[]); children.get(n.after).push(n);
  }
  for(const list of children.values())list.sort((a,b)=> b.clock-a.clock||(a.actor>b.actor?-1:a.actor<b.actor?1:0));
  const visited=new Set(), visible=[];
  const stack=[...(children.get(null)||[])].reverse();
  while(stack.length) {
    const n=stack.pop();visited.add(n.id);
    if(!s.removed.has(n.id))visible.push(n);
    stack.push(...[...(children.get(n.id)||[])].reverse());
  }
  return {text:visible.map(n=>n.text).join(''),ids:visible.map(n=>n.id),
    unresolved:[...s.nodes.keys()].filter(id=>!visited.has(id)).sort()};
}
export function seedText(text) {
  let s=emptySeq(),after=null;
  for(const char of text) { const r=seqInsert(s,'S',after,char);s=r.state;after=r.node.id; }
  return s;
}

// Rich text with explicit per-element boolean marks. No inherited boundary spans.
export function emptyRich(sequence=emptySeq()) { return {sequence,format:new Map()}; }
export function markIds(s,ids,property,enabled,identity) {
  if(typeof property!=='string'||!/^[A-Za-z]+$/.test(property)||typeof enabled!=='boolean') throw new Error('Invalid mark');
  let format=new Map(s.format);
  for(const target of ids) {
    if(!/^[A-Za-z]+:[1-9][0-9]*$/.test(target)) throw new Error('Invalid marked ID');
    format=mapWrite(format,`${target}/${property}`,{...identity,value:enabled});
  }
  return {sequence:s.sequence,format};
}
export function mergeRich(a,b) { return {sequence:mergeSeq(a.sequence,b.sequence),format:mergeMap(a.format,b.format)}; }
export function richView(s) {
  return seqView(s.sequence).ids.map(id=>{
    const marks={};for(const [key,cell] of s.format) {
      if(key.startsWith(`${id}/`)&&!cell.deleted&&cell.value) marks[key.slice(id.length+1)]=true;
    }
    return {id,text:s.sequence.nodes.get(id).text,marks};
  });
}
export function sortedMap(m) { return [...m].sort(([a],[b])=>a<b?-1:a>b?1:0); }
export function canonicalSeq(s) { return {nodes:sortedMap(s.nodes),removed:[...s.removed].sort()}; }
export function canonicalMV(s) { return {entries:sortedMap(s.entries),context:sortedMap(s.context)}; }
