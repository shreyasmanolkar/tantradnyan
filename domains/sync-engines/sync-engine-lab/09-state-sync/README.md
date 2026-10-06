# 09-state-sync: Why does copying the entire object lose unrelated edits?

Learner question: **Why does copying the entire object lose unrelated edits?**

Blind whole-state replacement loses one client mutation; CAS detects the stale base.

Read [the master guide](../../GUIDE.md), chapters 8, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 09-state-sync/src/demo.mjs
node --test 09-state-sync/tests/*.test.mjs
node 09-state-sync/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: One central authority; detection does not automatically merge the rejected branch.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
