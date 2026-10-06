# 03-udp: How does fresh state survive old or missing datagrams?

Learner question: **How does fresh state survive old or missing datagrams?**

A receiver keeps the highest sequence rather than waiting for gaps.

Read [the master guide](../../GUIDE.md), chapters 3, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 03-udp/src/demo.mjs
node --test 03-udp/tests/*.test.mjs
node 03-udp/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Real loopback datagrams; intentional application omission/repetition/reordering, no host packet manipulation.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.

## Supplemental mechanism experiments

- [reliable-model.mjs](src/reliable-model.mjs): run `node 03-udp/src/reliable-model.mjs` from the lab root.
