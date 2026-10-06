# 13-ot: How can both clients delete the original B while preserving X?

Learner question: **How can both clients delete the original B while preserving X?**

Pair transforms preserve the deletion target and satisfy the two-operation diamond.

Read [the master guide](../../GUIDE.md), chapters 9, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 13-ot/src/demo.mjs
node --test 13-ot/tests/*.test.mjs
node 13-ot/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Exactly two clients, one edit each per round, same base; no arbitrary OT control algorithm or TP2 claim.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
