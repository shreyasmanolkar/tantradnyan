export class VersionedRecord {
  #value;
  #version = 0;
  constructor(value) { this.#value = value; }
  read() { return { value: this.#value, version: this.#version }; }
  compareAndSet(expectedVersion, nextValue) {
    if (expectedVersion !== this.#version) return false;
    this.#value = nextValue;
    this.#version += 1;
    return true;
  }
}

// Synchronous single-process model: memory only, not durable acceptance.
export class DedupCounter {
  #value = 0;
  #results = new Map();
  get value() { return this.#value; }
  submit(id, delta) {
    if (typeof id !== 'string' || !id || !Number.isSafeInteger(delta)) {
      throw new Error('Invalid operation');
    }
    const previous = this.#results.get(id);
    if (previous) {
      if (previous.delta !== delta) throw new Error('Identity reused with different payload');
      return previous.result;
    }
    const next = this.#value + delta;
    if (!Number.isSafeInteger(next)) throw new Error('Counter overflow');
    this.#value = next;
    this.#results.set(id, { delta, result: next });
    return next;
  }
}

export function insert(text, position, value) {
  if (!Number.isInteger(position) || position < 0 || position > text.length) {
    throw new Error('Invalid position');
  }
  return text.slice(0, position) + value + text.slice(position);
}

export function relation(a, b) {
  if (a.length !== b.length || a.length === 0 ||
      [...a, ...b].some(x => !Number.isSafeInteger(x) || x < 0)) {
    throw new Error('Expected equal nonempty vectors of nonnegative safe integers');
  }
  const aLeB = a.every((x, i) => x <= b[i]);
  const bLeA = b.every((x, i) => x <= a[i]);
  if (aLeB && bLeA) return 'equal';
  if (aLeB) return 'before';
  if (bLeA) return 'after';
  return 'concurrent';
}
