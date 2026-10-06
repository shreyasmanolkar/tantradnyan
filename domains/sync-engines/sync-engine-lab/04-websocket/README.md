# 04-websocket: What does WebSocket framing add to TCP?

Learner question: **What does WebSocket framing add to TCP?**

Native Node WebSocket talks to the handwritten server frame parser.

Read [the master guide](../../GUIDE.md), chapters 4, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 04-websocket/src/demo.mjs
node --test 04-websocket/tests/*.test.mjs
node 04-websocket/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Bounded text frames only; localhost, no TLS, origin checks or authentication.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.

## Supplemental mechanism experiments

- [http-carriers.mjs](src/http-carriers.mjs): run `node 04-websocket/src/http-carriers.mjs` from the lab root.
- [channel-model.mjs](src/channel-model.mjs): run `node 04-websocket/src/channel-model.mjs` from the lab root.
