// Bounded ASCII, one-character insert/delete laboratory. TP1 is tested;
// TP2 fails. Do not use as a general distributed editor.
function checked(op) {
  if (!op || typeof op.id !== 'string' || !/^[A-Za-z0-9:._-]+$/.test(op.id)) throw new Error('Invalid identity');
  if (!['insert', 'delete', 'noop'].includes(op.kind)) throw new Error('Invalid kind');
  if (op.kind === 'noop') return;
  if (!Number.isSafeInteger(op.at) || op.at < 0) throw new Error('Invalid position');
  if (op.kind === 'insert' &&
      (typeof op.text !== 'string' || !/^[\x20-\x7e]$/.test(op.text))) {
    throw new Error('Expected one printable ASCII character');
  }
}
export function insert(at, text, id) {
  const op = { kind: 'insert', at, text, id }; checked(op); return op;
}
export function del(at, id) {
  const op = { kind: 'delete', at, id }; checked(op); return op;
}
export function noop(id) { const op = { kind: 'noop', id }; checked(op); return op; }
export function apply(text, op) {
  if (typeof text !== 'string' || !/^[\x20-\x7e]*$/.test(text)) {
    throw new Error('Expected printable ASCII document');
  }
  checked(op);
  if (op.kind === 'noop') return text;
  const limit = op.kind === 'insert' ? text.length : text.length - 1;
  if (op.at > limit) throw new Error('Operation outside document');
  return text.slice(0, op.at) + (op.kind === 'insert' ? op.text : '') +
    text.slice(op.at + (op.kind === 'delete' ? 1 : 0));
}
export function transform(a, b) {
  checked(a); checked(b);
  if (a.id === b.id) throw new Error('Transform requires distinct operation identities');
  if (a.kind === 'noop' || b.kind === 'noop') return { ...a };
  if (a.kind === 'insert' && b.kind === 'insert') {
    return { ...a, at: a.at + (b.at < a.at || (b.at === a.at && b.id < a.id) ? 1 : 0) };
  }
  if (a.kind === 'insert' && b.kind === 'delete') {
    return { ...a, at: a.at - (b.at < a.at ? 1 : 0) };
  }
  if (a.kind === 'delete' && b.kind === 'insert') {
    return { ...a, at: a.at + (b.at <= a.at ? 1 : 0) };
  }
  if (a.at === b.at) return noop(a.id);
  return { ...a, at: a.at - (b.at < a.at ? 1 : 0) };
}
export function diamond(base, a, b) {
  const aLocal = apply(base, a), bLocal = apply(base, b);
  const bAfterA = transform(b, a), aAfterB = transform(a, b);
  return { aLocal, bLocal, bAfterA, aAfterB,
    aFinal: apply(aLocal, bAfterA), bFinal: apply(bLocal, aAfterB) };
}
// Only one concurrent operation per client, two clients, common initial base.
// New rounds may start only after all participants have this round's final state.
export function oneRound(base, a, b, first = 'a') {
  if (!['a', 'b'].includes(first)) throw new Error('Invalid first actor');
  const d = diamond(base, a, b);
  return { ...d, server: first === 'a' ? d.aFinal : d.bFinal,
    committed: first === 'a' ? [a, d.bAfterA] : [b, d.aAfterB],
    acknowledgments: [a.id, b.id] };
}
export function tp2Witness() {
  const base = 'ab';
  const a = insert(0, 'X', 'M:1');
  const b = del(0, 'C:1');
  const c = insert(1, 'Y', 'D:1');
  const afterAB = apply(apply(base, a), transform(b, a));
  const afterBA = apply(apply(base, b), transform(a, b));
  const cAfterAB = transform(transform(c, a), transform(b, a));
  const cAfterBA = transform(transform(c, b), transform(a, b));
  return { base, afterAB, afterBA, cAfterAB, cAfterBA,
    left: apply(afterAB, cAfterAB), right: apply(afterBA, cAfterBA) };
}
export function mapCursor(position, op, affinity = 'after') {
  checked(op);
  if (!Number.isSafeInteger(position) || position < 0 || !['before', 'after'].includes(affinity)) {
    throw new Error('Invalid cursor');
  }
  if (op.kind === 'insert' && (op.at < position || (op.at === position && affinity === 'after'))) {
    return position + 1;
  }
  if (op.kind === 'delete' && op.at < position) return position - 1;
  return position;
}
