# 02-tcp: Why is a TCP data callback not a message?

Learner question: **Why is a TCP data callback not a message?**

Length-prefixed framing recovers complete messages from arbitrary byte chunks.

Read [the master guide](../../GUIDE.md), chapters 3, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 02-tcp/src/demo.mjs
node --test 02-tcp/tests/*.test.mjs
node 02-tcp/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Real loopback TCP plus a deterministic fragmentation fixture; no packet capture or TCP reimplementation.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.

## Supplemental mechanism experiments

- [transport-model.mjs](src/transport-model.mjs): run `node 02-tcp/src/transport-model.mjs` from the lab root.
