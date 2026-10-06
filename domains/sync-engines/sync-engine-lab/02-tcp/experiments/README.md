# Failure experiment: Why is a TCP data callback not a message?

## Hypothesis

Length-prefixed framing recovers complete messages from arbitrary byte chunks. Change the indicated rule in the source; a violated assertion or changed result would overturn the prediction for this model.

## Setup and controls

Source: working tree for this curriculum. Node.js 22.4+. Fixed inputs are visible in [driver](../src/demo.mjs); randomized network schedules use xorshift32 with seed 7, logical milliseconds and event ordering `(time, insertion sequence)`. Do not interpret simulated time as a measured network latency.

## Driver and expected result

From the lab root: `node 02-tcp/experiments/run.mjs`. The demo's named assertions specify exact expected properties. The local fixture exposes length-prefixed framing recovers complete messages from arbitrary byte chunks.

To combine latency, loss, duplication, reordering, disconnect, server restart, stale cursors and concurrent writers, run `node 20-production-sync-engine/experiments/run.mjs`. That driver exercises the integrated protocol. Not every fault is meaningful for a memory-only primitive: a G-Set merge has no socket or server to restart.

## Actual result

Not run in this local document. Repository validation and raw combined observations, when available, are recorded in [the curriculum evidence](../../../experiments/README.md). These are model results, never learner mastery or production throughput measurements.

## Explanation and limitations

Real loopback TCP plus a deterministic fragmentation fixture; no packet capture or TCP reimplementation. A passing example supplies evidence for the stated transition model, not a universal proof. Preserve changed traces when a hypothesis fails.

## Further experiment

Remove one identity/version/context field. Find the smallest counterexample; then restore it and state why it is sufficient under the declared assumptions.
