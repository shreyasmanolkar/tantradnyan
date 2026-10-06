# 18-multiplayer: What does a late input change in a deterministic simulation?

Learner question: **What does a late input change in a deterministic simulation?**

Prediction replays unacknowledged inputs; interpolation renders the past; rollback replays corrected history.

Read [the master guide](../../GUIDE.md), chapters 16, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 18-multiplayer/src/demo.mjs
node --test 18-multiplayer/tests/*.test.mjs
node 18-multiplayer/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: One integer entity, fixed steps, no physics, wall-clock tick loop, renderer or anti-cheat proof.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
