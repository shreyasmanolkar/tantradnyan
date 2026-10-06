// States are plain serializable data. Merges do not mutate inputs.
const union = (a,b) => [...new Set([...a,...b])].sort();
const own = (s,k,fallback) => Object.hasOwn(s,k) ? s[k] : fallback;
export const gIncrement = (s, actor, n = 1) => {
  if (!Number.isSafeInteger(n) || n < 0) throw Error('nonnegative integer increment required');
  const next = own(s,actor,0) + n;
  if (!Number.isSafeInteger(next)) throw Error('component exceeds safe integer range');
  return {...s, [actor]: next};
};
export const gMerge = (a,b) => Object.fromEntries(union(Object.keys(a),Object.keys(b)).map(k => [k, Math.max(own(a,k,0), own(b,k,0))]));
export const gValue = s => Object.values(s).reduce((a,b) => a+b,0);
export const pnEmpty = () => ({p:{},n:{}});
export const pnAdd = (s,actor,n) => n >= 0 ? {...s,p:gIncrement(s.p,actor,n)} : {...s,n:gIncrement(s.n,actor,-n)};
export const pnMerge = (a,b) => ({p:gMerge(a.p,b.p),n:gMerge(a.n,b.n)});
export const pnValue = s => gValue(s.p) - gValue(s.n);
export const setAdd = (s,x) => union(s,[x]);
export const setMerge = union;
export const twoEmpty = () => ({adds:[],removes:[]});
export const twoAdd = (s,x) => ({...s,adds:union(s.adds,[x])});
export const twoRemove = (s,x) => ({...s,removes:union(s.removes,[x])});
export const twoMerge = (a,b) => ({adds:union(a.adds,b.adds),removes:union(a.removes,b.removes)});
export const twoValue = s => s.adds.filter(x => !s.removes.includes(x));
export const orEmpty = () => ({adds:{},removed:[]});
export const orAdd = (s,x,tag) => ({...s,adds:{...s.adds,[x]:union(own(s.adds,x,[]),[tag])}});
export const orRemove = (s,x) => ({...s,removed:union(s.removed,own(s.adds,x,[]))});
export function orMerge(a,b) {
  return {adds:Object.fromEntries(union(Object.keys(a.adds),Object.keys(b.adds)).map(k => [k,union(own(a.adds,k,[]),own(b.adds,k,[]))])),removed:union(a.removed,b.removed)};
}
export const orValue = s => Object.keys(s.adds).sort().filter(k => s.adds[k].some(t => !s.removed.includes(t)));
// Tags are [logical_counter, actor], globally unique for each assignment.
export const compareTag = (a,b) => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
export function lwwMerge(a,b) {
  if (!a) return structuredClone(b); if (!b) return structuredClone(a);
  const cmp = compareTag(a.tag,b.tag);
  if (cmp === 0 && JSON.stringify(a.value) !== JSON.stringify(b.value)) throw Error('same tag with different payload');
  return structuredClone(cmp >= 0 ? a : b);
}
export const mapWrite = (s,key,value,tag) => ({...s,[key]:lwwMerge(own(s,key,null),{tag,value})});
export const mapMerge = (a,b) => Object.fromEntries(union(Object.keys(a),Object.keys(b)).map(k => [k,lwwMerge(own(a,k,null),own(b,k,null))]));
export const mapValue = s => Object.fromEntries(Object.entries(s).filter(([,r]) => !r.value?.deleted).map(([k,r]) => [k,r.value]));
// RGA-like grow-only insertion tree plus grow-only removed IDs.
// A tombstoned node still anchors its descendants. Missing anchors hide a subtree
// until repair supplies the ancestor. IDs are JSON-encoded [counter, actor].
export const textEmpty = () => ({nodes:{},removed:[]});
export const textID = tag => JSON.stringify(tag);
export function textInsert(s,tag,left,char) {
  const id = textID(tag);
  if ([...char].length !== 1) throw Error('one code point required');
  const node = {tag,left,char};
  if (s.nodes[id] && JSON.stringify(s.nodes[id]) !== JSON.stringify(node)) throw Error('ID collision');
  return {...s,nodes:{...s.nodes,[id]:node}};
}
export const textRemove = (s,id) => ({...s,removed:union(s.removed,[id])});
export function textMerge(a,b) {
  const nodes = {...a.nodes};
  for (const [id,node] of Object.entries(b.nodes)) {
    if (nodes[id] && JSON.stringify(nodes[id]) !== JSON.stringify(node)) throw Error('ID collision');
    nodes[id] = structuredClone(node);
  }
  return {nodes,removed:union(a.removed,b.removed)};
}
export function textVisible(s) {
  const out = [], visited = new Set();
  function visit(left) {
    const children = Object.entries(s.nodes).filter(([,n]) => n.left === left).sort((a,b) => compareTag(b[1].tag,a[1].tag));
    for (const [id,n] of children) {
      if (visited.has(id)) throw Error('cycle'); visited.add(id);
      if (!s.removed.includes(id)) out.push({id,char:n.char}); visit(id);
    }
  }
  visit(null); return out;
}
export const textValue = s => textVisible(s).map(n => n.char).join('');
