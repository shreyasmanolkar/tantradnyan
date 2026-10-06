# 16-chat: Why should typing expire while message history persists?

Learner question: **Why should typing expire while message history persists?**

History uses deduped durable operations; typing is a TTL sample; read cursor advances monotonically.

Read [the master guide](../../GUIDE.md), chapters 13, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 16-chat/src/demo.mjs
node --test 16-chat/tests/*.test.mjs
node 16-chat/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Single channel; no permissions, encryption, unread counters or delivery to multiple devices.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
