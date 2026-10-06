# 05-concurrency: Can a single event loop lose a write?

Learner question: **Can a single event loop lose a write?**

Two asynchronous read/modify/write operations interleave across await; a mutex serializes the section.

Read [the master guide](../../GUIDE.md), chapters 2, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 05-concurrency/src/demo.mjs
node --test 05-concurrency/tests/*.test.mjs
node 05-concurrency/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: No OS scheduler model; Atomics demonstration operates on one shared word.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.

## Supplemental mechanism experiments

- [workers.mjs](src/workers.mjs): run `node 05-concurrency/src/workers.mjs` from the lab root.
