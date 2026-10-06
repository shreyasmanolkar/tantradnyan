# 06-cas: Why must the version check and write be indivisible?

Learner question: **Why must the version check and write be indivisible?**

A stale version fails; an untagged atomic word exhibits ABA.

Read [the master guide](../../GUIDE.md), chapters 2, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 06-cas/src/demo.mjs
node --test 06-cas/tests/*.test.mjs
node 06-cas/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: VersionedCell is one JS agent; separate atomic value/version words would not implement this contract.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
