# 08-optimistic-concurrency: Why does avoiding write/write conflicts still permit write skew?

Learner question: **Why does avoiding write/write conflicts still permit write skew?**

Snapshot transactions disable two on-call doctors; validating read dependencies aborts one.

Read [the master guide](../../GUIDE.md), chapters 7, 12, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 08-optimistic-concurrency/src/demo.mjs
node --test 08-optimistic-concurrency/tests/*.test.mjs
node 08-optimistic-concurrency/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Fixed keys, no predicates, phantoms, SQL planner or persistence; read validation covers this model only.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
