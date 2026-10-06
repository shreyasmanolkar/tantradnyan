// One-code-point insert/delete. A round contains exactly one outstanding edit
// from each of two clients, against an identical starting revision.
export function apply(text, op) {
  const chars = [...text];
  if (op.type === 'noop') return text;
  if (!Number.isInteger(op.pos) || op.pos < 0 || op.pos > chars.length || (op.type === 'delete' && op.pos === chars.length)) throw Error('invalid position');
  if (op.type === 'insert') {
    if ([...op.char].length !== 1) throw Error('one code point required');
    chars.splice(op.pos, 0, op.char);
  } else if (op.type === 'delete') chars.splice(op.pos, 1);
  else throw Error('invalid operation');
  return chars.join('');
}
export function transform(op, against) {
  const o = {...op};
  if (o.type === 'noop' || against.type === 'noop') return o;
  if (against.type === 'insert') {
    if (o.type === 'insert') {
      if (o.pos > against.pos || (o.pos === against.pos && o.id > against.id)) o.pos++;
    } else if (o.pos >= against.pos) o.pos++;
  } else {
    if (o.type === 'delete' && o.pos === against.pos) return {...o, type: 'noop'};
    if (o.pos > against.pos) o.pos--;
  }
  return o;
}
export function round(text, a, b) {
  if (a.id === b.id) throw Error('unique operation IDs required');
  const localA = apply(text,a), localB = apply(text,b);
  const aAfterB = transform(a,b), bAfterA = transform(b,a);
  return {localA, localB, aAfterB, bAfterA, finalA: apply(localA,bAfterA), finalB: apply(localB,aAfterB)};
}
