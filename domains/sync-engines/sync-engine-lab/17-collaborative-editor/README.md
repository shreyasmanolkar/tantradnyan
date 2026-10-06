# 17-collaborative-editor: How do stable anchors avoid shifting text offsets?

Learner question: **How do stable anchors avoid shifting text offsets?**

A sequence tree merges insertions with deletion of an anchor; a deleted parent still orders children.

Read [the master guide](../../GUIDE.md), chapters 10, 14, then [the local walkthrough](GUIDE.md).

From `domains/sync-engines/sync-engine-lab`:

```sh
node 17-collaborative-editor/src/demo.mjs
node --test 17-collaborative-editor/tests/*.test.mjs
node 17-collaborative-editor/experiments/run.mjs
```

Requires Node.js 22.4+ with native `WebSocket`; no npm packages. Socket demos bind only loopback and choose an ephemeral port. Model loops and test durations are bounded; the interactive server runs until stopped. A successful model run does not imply a performance measurement.

Model limitations: Code points, ASCII examples; no grapheme clusters, rich text, IME, undo or secure identity.

Code: [demo](src/demo.mjs). Supporting transition functions live in [shared](../shared/) and are intentionally small and inspectable. [Experiment](experiments/README.md) includes prediction, failures and evidence scope.
