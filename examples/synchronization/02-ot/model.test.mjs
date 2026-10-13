import test from 'node:test';
import assert from 'node:assert/strict';
import { insert, del, noop, apply, transform, diamond, oneRound, tp2Witness, mapCursor } from './model.mjs';
function operations(n, actor, text) {
  return [...Array.from({ length: n + 1 }, (_, p) => insert(p, text, `${actor}:i${p}`)),
    ...Array.from({ length: n }, (_, p) => del(p, `${actor}:d${p}`)), noop(`${actor}:n`)];
}
test('TP1 holds for all 220 pairs over document lengths zero through four', () => {
  let count = 0;
  for (let n = 0; n <= 4; n++) {
    const base = 'abcd'.slice(0, n);
    for (const a of operations(n, 'M', 'X')) for (const b of operations(n, 'D', 'Y')) {
      const d = diamond(base, a, b);
      assert.equal(d.aFinal, d.bFinal, JSON.stringify({ base, a, b })); count++;
    }
  }
  assert.equal(count, 220);
});
test('concurrent inserts preserve their intended distinct gaps', () => {
  const d = diamond('cat', insert(1,'X','M:1'), insert(2,'Y','D:1'));
  assert.equal(d.aFinal,'cXaYt'); assert.equal(d.bAfterA.at,3);
});
test('same-position insertion has a defined stable identity priority', () => {
  const d = diamond('cat', insert(1,'X','M:1'), insert(1,'Y','D:1'));
  assert.equal(d.aFinal,'cYXat');
});
test('insert survives deletion of the original character at the same position', () => {
  const d = diamond('cat', insert(1,'X','M:1'), del(1,'D:1'));
  assert.equal(d.aFinal,'cXt'); assert.equal(d.bAfterA.at,2);
});
test('same original character deletion becomes a no-op', () => {
  const d = diamond('cat', del(1,'M:1'), del(1,'D:1'));
  assert.equal(d.aFinal,'ct'); assert.equal(d.bAfterA.kind,'noop');
});
test('serial replacement is explicitly two dependent operations', () => {
  assert.equal(apply(apply('cat',del(1,'M:1')),insert(1,'X','M:2')),'cXt');
});
test('one-round authority matches both optimistic clients in both arrival orders', () => {
  for (const order of ['a','b']) {
    const r = oneRound('cat',insert(1,'X','M:1'),del(1,'D:1'),order);
    assert.equal(r.server,r.aFinal); assert.equal(r.server,r.bFinal);
    assert.equal(r.committed.reduce(apply,'cat'),r.server);
    assert.deepEqual([...r.acknowledgments].sort(),['D:1','M:1']);
  }
});
test('TP1 does not establish TP2: retained regression witness diverges', () => {
  const w = tp2Witness();
  assert.equal(w.afterAB,w.afterBA); assert.equal(w.afterAB,'Xb');
  assert.equal(w.cAfterAB.at,1); assert.equal(w.cAfterBA.at,0);
  assert.equal(w.left,'XYb'); assert.equal(w.right,'YXb');
  assert.notEqual(w.left,w.right);
});
test('cursor mapping declares boundary affinity and deletion contraction', () => {
  const op = insert(1,'X','M:1');
  assert.equal(mapCursor(1,op,'before'),1); assert.equal(mapCursor(1,op,'after'),2);
  assert.equal(mapCursor(2,del(1,'D:1')),1);
});
test('invalid positions, non-ASCII text and identity reuse are rejected', () => {
  assert.throws(() => insert(0,'😀','M:1'),/ASCII/);
  assert.throws(() => noop(undefined),/identity/);
  assert.throws(() => apply('cat',del(3,'M:1')),/outside/);
  assert.throws(() => apply('😀',noop('M:1')),/ASCII/);
  assert.throws(() => transform(insert(0,'X','M:1'),del(0,'M:1')),/distinct/);
});
