import { relation } from '../00-foundations/model.mjs';

function nonnegative(x, name) {
  if (!Number.isFinite(x) || x < 0) throw new Error(`Invalid ${name}`);
}
function probability(x, name) {
  nonnegative(x, name);
  if (x > 1) throw new Error(`Invalid ${name}`);
}
function id(x) {
  if (typeof x !== 'string' || !/^[A-Za-z0-9:._-]+$/.test(x)) {
    throw new Error('Expected nonempty ASCII identity');
  }
}
function scalar(x) {
  if (x !== null && typeof x !== 'string' && typeof x !== 'boolean' &&
      !(typeof x === 'number' && Number.isFinite(x))) {
    throw new Error('Expected finite JSON scalar');
  }
}

export function allArrive(p, count) {
  probability(p, 'loss');
  if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid count');
  return (1 - p) ** count;
}
export function retryModel(requestLoss, ackLoss, maxAttempts) {
  probability(requestLoss, 'request loss');
  probability(ackLoss, 'ack loss');
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) {
    throw new Error('Invalid attempt limit');
  }
  const q = 1 - (1 - requestLoss) * (1 - ackLoss);
  return {
    q,
    expectedUnlimited: q === 1 ? Infinity : 1 / (1 - q),
    unacknowledged: q ** maxAttempts,
    expectedCapped: q === 1 ? maxAttempts : (1 - q ** maxAttempts) / (1 - q),
  };
}
export function occupancy(rate, residenceSeconds) {
  nonnegative(rate, 'rate'); nonnegative(residenceSeconds, 'residence');
  return rate * residenceSeconds;
}
export function clockBound(initialSeconds, driftFraction, elapsedSeconds) {
  nonnegative(initialSeconds, 'initial error');
  nonnegative(driftFraction, 'drift'); nonnegative(elapsedSeconds, 'elapsed');
  return initialSeconds + driftFraction * elapsedSeconds;
}

// Explicit total ordering; this function does not generate clock stamps.
function checkedCandidate(x) {
  if (!x || !Number.isSafeInteger(x.stamp) || x.stamp < 0) {
    throw new Error('Invalid stamp');
  }
  id(x.actor); id(x.id); scalar(x.value);
}
export function lww(a, b) {
  checkedCandidate(a); checkedCandidate(b);
  const keyA = [a.stamp, a.actor, a.id];
  const keyB = [b.stamp, b.actor, b.id];
  for (let i = 0; i < keyA.length; i++) {
    if (keyA[i] < keyB[i]) return { ...b };
    if (keyA[i] > keyB[i]) return { ...a };
  }
  if (!Object.is(a.value, b.value)) throw new Error('Equal ordering key has different payload');
  return { ...a };
}

function field(record, key) {
  return Object.hasOwn(record, key)
    ? { present: true, value: record[key] } : { present: false };
}
function same(a, b) {
  return a.present === b.present && (!a.present || Object.is(a.value, b.value));
}
function checkedRecord(x) {
  if (!x || Array.isArray(x) || typeof x !== 'object') throw new Error('Expected flat record');
  for (const value of Object.values(x)) scalar(value);
}
export function threeWay(base, local, remote) {
  for (const record of [base, local, remote]) checkedRecord(record);
  const merged = Object.create(null); // Keys such as __proto__ are inert data.
  const conflicts = [];
  const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)]);
  for (const key of [...keys].sort()) {
    const b = field(base, key), l = field(local, key), r = field(remote, key);
    let chosen;
    if (same(l, r)) chosen = l;
    else if (same(l, b)) chosen = r;
    else if (same(r, b)) chosen = l;
    else { conflicts.push({ key, base: b, local: l, remote: r }); continue; }
    if (chosen.present) merged[key] = chosen.value;
  }
  return { merged, conflicts };
}

// Grow-only audit evidence, NOT a compact production multi-value register.
export function addWrite(history, write) {
  if (!(history instanceof Map)) throw new Error('Expected history Map');
  id(write.id); scalar(write.value);
  relation(write.vector, write.vector); // Validate the complete vector representation.
  const next = new Map(history);
  for (const old of history.values()) {
    const rel = relation(old.vector, write.vector);
    if (old.id === write.id) {
      if (rel !== 'equal' || !Object.is(old.value, write.value)) {
        throw new Error('Write identity reused with different content');
      }
      return next;
    }
    if (rel === 'equal') throw new Error('Distinct writes cannot share a complete event vector');
  }
  next.set(write.id, Object.freeze({
    id: write.id, value: write.value, vector: Object.freeze([...write.vector]),
  }));
  return next;
}
export function mergeWrites(a, b) {
  let next = new Map(a);
  for (const write of b.values()) next = addWrite(next, write);
  return next;
}
export function frontier(history) {
  return [...history.values()].filter(write =>
    ![...history.values()].some(other => relation(write.vector, other.vector) === 'before')
  ).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

// Tombstone observed-remove set. Returned states are treated as immutable by callers.
export function emptyOR() { return { adds: new Map(), removed: new Set() }; }
export function addTag(state, additionId, tag) {
  id(additionId);
  if (typeof tag !== 'string' || !tag) throw new Error('Expected tag');
  if (state.adds.has(additionId) && state.adds.get(additionId) !== tag) {
    throw new Error('Addition identity reused with different tag');
  }
  const adds = new Map(state.adds);
  adds.set(additionId, tag);
  return { adds, removed: new Set(state.removed) };
}
export function applyRemoval(state, observedIds) {
  const removed = new Set(state.removed);
  for (const additionId of observedIds) { id(additionId); removed.add(additionId); }
  return { adds: new Map(state.adds), removed };
}
export function removeObserved(state, tag) {
  return applyRemoval(state, [...state.adds]
    .filter(([additionId, value]) => value === tag && !state.removed.has(additionId))
    .map(([additionId]) => additionId));
}
export function mergeOR(a, b) {
  let next = { adds: new Map(a.adds), removed: new Set(a.removed) };
  for (const [additionId, tag] of b.adds) next = addTag(next, additionId, tag);
  return applyRemoval(next, b.removed);
}
export function tags(state) {
  return [...new Set([...state.adds]
    .filter(([additionId]) => !state.removed.has(additionId))
    .map(([, tag]) => tag))].sort();
}
export function canonicalOR(state) {
  return { adds: [...state.adds].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0),
    removed: [...state.removed].sort() };
}
export function permutations(items) {
  if (items.length === 0) return [[]];
  return items.flatMap((item, i) =>
    permutations(items.filter((_, j) => j !== i)).map(rest => [item, ...rest]));
}
