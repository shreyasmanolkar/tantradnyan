# 19-server-authoritative-game: How do retries avoid applying the same input twice?

Learner question: **How do retries avoid applying the same input twice?**

Authority buffers sequence gaps, validates input, applies each input once, and acknowledges a contiguous prefix.

Read [the master guide](../../GUIDE.md), chapters 16, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 19-server-authoritative-game/src/demo.mjs
node --test 19-server-authoritative-game/tests/*.test.mjs
node 19-server-authoritative-game/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Input-triggered steps; production games need paced ticks, deadlines and policies for permanently missing input.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
