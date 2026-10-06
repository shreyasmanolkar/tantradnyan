# 07-versioning: Which timestamps detect concurrency?

Learner question: **Which timestamps detect concurrency?**

Vector comparison distinguishes concurrent events; Lamport and HLC only extend causality.

Read [the master guide](../../GUIDE.md), chapters 5–6, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 07-versioning/src/demo.mjs
node --test 07-versioning/tests/*.test.mjs
node 07-versioning/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Explicit wall-clock samples, fixed actor identities, no bounded-skew assumption.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.

## Supplemental mechanism experiments

- [math-model.mjs](src/math-model.mjs): run `node 07-versioning/src/math-model.mjs` from the lab root.
