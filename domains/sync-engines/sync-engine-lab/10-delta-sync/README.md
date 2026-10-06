# 10-delta-sync: When is a delta independently mergeable?

Learner question: **When is a delta independently mergeable?**

Absolute counter components tolerate replay; positional or additive patches require context/dedup.

Read [the master guide](../../GUIDE.md), chapters 8–10, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 10-delta-sync/src/demo.mjs
node --test 10-delta-sync/tests/*.test.mjs
node 10-delta-sync/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Sparse G-Counter delta only; not a general JSON diff algorithm.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
