# 15-offline-sync: What survives a client process restart before delivery?

Learner question: **What survives a client process restart before delivery?**

Counter and outbox persist together; restart reuses the original operation ID.

Read [the master guide](../../GUIDE.md), chapters 11, 15, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 15-offline-sync/src/demo.mjs
node --test 15-offline-sync/tests/*.test.mjs
node 15-offline-sync/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Memory-backed Store emulates disk here; final integration tests use real temporary files.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
