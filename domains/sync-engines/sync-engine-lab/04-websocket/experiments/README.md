# Failure experiment: What does WebSocket framing add to TCP?

## Hypothesis

Native Node WebSocket talks to the handwritten server frame parser. Change the indicated rule in the source; a violated assertion or changed result would overturn the prediction for this model.

## Setup and controls

Source: working tree for this curriculum. Node.js 22.4+. Fixed inputs are visible in [driver](../src/demo.mjs); randomized network schedules use xorshift32 with seed 7, logical milliseconds and event ordering `(time, insertion sequence)`. Do not interpret simulated time as a measured network latency.

## Driver and expected result

From the lab root: `node 04-websocket/experiments/run.mjs`. The demo's named assertions specify exact expected properties. The local fixture exposes native node websocket talks to the handwritten server frame parser.

To combine latency, loss, duplication, reordering, disconnect, server restart, stale cursors and concurrent writers, run `node 20-production-sync-engine/experiments/run.mjs`. That driver exercises the integrated protocol. Not every fault is meaningful for a memory-only primitive: a G-Set merge has no socket or server to restart.

## Actual result

Not run in this local document. Repository validation and raw combined observations, when available, are recorded in [the curriculum evidence](../../../experiments/README.md). These are model results, never learner mastery or production throughput measurements.

## Explanation and limitations

Bounded text frames only; localhost, no TLS, origin checks or authentication. A passing example supplies evidence for the stated transition model, not a universal proof. Preserve changed traces when a hypothesis fails.

## Further experiment

Remove one identity/version/context field. Find the smallest counterexample; then restore it and state why it is sufficient under the declared assumptions.
