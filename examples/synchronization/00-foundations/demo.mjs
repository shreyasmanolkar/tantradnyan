import { VersionedRecord, DedupCounter, insert, relation } from './model.mjs';

let unsafe = 0;
const miraRead = unsafe;
const devRead = unsafe;
unsafe = miraRead + 1;
unsafe = devRead + 1;
console.log(`lost update: ${unsafe} (two intended increments)`);

const record = new VersionedRecord(0);
const mira = record.read();
const dev = record.read();
record.compareAndSet(mira.version, mira.value + 1);
if (!record.compareAndSet(dev.version, dev.value + 1)) {
  const fresh = record.read();
  record.compareAndSet(fresh.version, fresh.value + 1);
}
console.log(`CAS retry: ${record.read().value}`);

const counter = new DedupCounter();
counter.submit('M:1', 1); // Commit happened; imagine its acknowledgment was lost.
const replay = counter.submit('M:1', 1);
const next = counter.submit('D:1', 1);
console.log(`replayed identity: ${replay}; new identity: ${next}`);

const mThenD = insert(insert('cat', 1, 'X'), 2, 'Y');
const dThenM = insert(insert('cat', 2, 'Y'), 1, 'X');
console.log(`M then D: ${mThenD}; D then M: ${dThenM}`);
console.log(`vector relation: ${relation([1, 0], [0, 1])}`);
