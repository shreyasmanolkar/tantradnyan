# 20-production-sync-engine: Which invariants survive loss, offline edits, replay and restart?

Learner question: **Which invariants survive loss, offline edits, replay and restart?**

A persistent server log orders writes; durable outboxes retry stable IDs; snapshots repair old cursors.

Read [the master guide](../../GUIDE.md), chapters 17–19, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 20-production-sync-engine/src/demo.mjs
node --test 20-production-sync-engine/tests/*.test.mjs
node 20-production-sync-engine/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: One room and one writer process; server-order field replacement, no consensus, authorization, power-loss guarantee or text CRDT integration.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
