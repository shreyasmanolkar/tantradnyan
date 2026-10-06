# 12-event-sourcing: What must replay know besides event bytes?

Learner question: **What must replay know besides event bytes?**

Immutable accepted facts reconstruct a balance; event schema interpretation is explicit.

Read [the master guide](../../GUIDE.md), chapters 8, 12, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 12-event-sourcing/src/demo.mjs
node --test 12-event-sourcing/tests/*.test.mjs
node 12-event-sourcing/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: In-memory demonstration; events are facts, not authenticated payment requests.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
