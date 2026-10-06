# 14-crdt: Which algebra makes replay and reordering harmless?

Learner question: **Which algebra makes replay and reordering harmless?**

Eight plain-data types merge concurrent states; observed remove preserves unseen adds.

Read [the master guide](../../GUIDE.md), chapters 10, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 14-crdt/src/demo.mjs
node --test 14-crdt/tests/*.test.mjs
node 14-crdt/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Trusted replicas, permanent tombstones, logical LWW tags; no compaction or invariant enforcement.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.

## Supplemental mechanism experiments

- [operation-based.mjs](src/operation-based.mjs): run `node 14-crdt/src/operation-based.mjs` from the lab root.
