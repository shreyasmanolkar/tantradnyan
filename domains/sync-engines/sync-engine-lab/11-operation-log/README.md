# 11-operation-log: How do stable IDs make retries safe?

Learner question: **How do stable IDs make retries safe?**

Lost ACK followed by identical retry returns the same committed entry; gaps wait for replay.

Read [the master guide](../../GUIDE.md), chapters 8, 15, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 11-operation-log/src/demo.mjs
node --test 11-operation-log/tests/*.test.mjs
node 11-operation-log/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Single server JSON transaction; no replicated consensus or external side effects.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.

## Supplemental mechanism experiments

- [quorum-model.mjs](src/quorum-model.mjs): run `node 11-operation-log/src/quorum-model.mjs` from the lab root.
