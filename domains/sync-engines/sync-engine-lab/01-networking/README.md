# 01-networking: Why can delivery order differ from send order?

Learner question: **Why can delivery order differ from send order?**

A seeded discrete-event trace separates sends from deliveries.

Read [the master guide](../../GUIDE.md), chapters 1–3, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 01-networking/src/demo.mjs
node --test 01-networking/tests/*.test.mjs
node 01-networking/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Application messages are modeled; no IP stack, router, congestion controller or real clock.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.

## Supplemental mechanism experiments

- [routing-model.mjs](src/routing-model.mjs): run `node 01-networking/src/routing-model.mjs` from the lab root.
