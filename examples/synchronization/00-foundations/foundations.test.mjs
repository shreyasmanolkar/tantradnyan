import test from 'node:test';
import assert from 'node:assert/strict';
import { VersionedRecord, DedupCounter, insert, relation } from './model.mjs';

test('unconditional read-modify-write loses an intended increment', () => {
  let value = 0;
  const a = value;
  const b = value;
  value = a + 1;
  value = b + 1;
  assert.equal(value, 1);
});

test('CAS rejects the stale base and a recomputed increment succeeds', () => {
  const record = new VersionedRecord(0);
  const a = record.read();
  const b = record.read();
  assert.equal(record.compareAndSet(a.version, a.value + 1), true);
  assert.equal(record.compareAndSet(b.version, b.value + 1), false);
  assert.deepEqual(record.read(), { value: 1, version: 1 });
  const retry = record.read();
  assert.equal(record.compareAndSet(retry.version, retry.value + 1), true);
  assert.deepEqual(record.read(), { value: 2, version: 2 });
});

test('duplicate returns original result even after an intervening operation', () => {
  const counter = new DedupCounter();
  assert.equal(counter.submit('M:1', 1), 1);
  assert.equal(counter.submit('D:1', 1), 2);
  assert.equal(counter.submit('M:1', 1), 1);
  assert.equal(counter.value, 2);
});

test('identity cannot silently name a different payload', () => {
  const counter = new DedupCounter();
  counter.submit('M:1', 1);
  assert.throws(() => counter.submit('M:1', 8), /different payload/);
  assert.equal(counter.value, 1);
});

test('same text operations in different orders need not converge', () => {
  const a = insert(insert('cat', 1, 'X'), 2, 'Y');
  const b = insert(insert('cat', 2, 'Y'), 1, 'X');
  assert.equal(a, 'cXYat');
  assert.equal(b, 'cXaYt');
  assert.notEqual(a, b);
});

test('componentwise comparison detects ancestry and concurrency', () => {
  assert.equal(relation([1, 0], [0, 1]), 'concurrent');
  assert.equal(relation([1, 0], [1, 2]), 'before');
  assert.equal(relation([1, 2], [1, 0]), 'after');
  assert.equal(relation([1, 2], [1, 2]), 'equal');
  assert.throws(() => relation([1], [1, 0]), /equal nonempty/);
});
