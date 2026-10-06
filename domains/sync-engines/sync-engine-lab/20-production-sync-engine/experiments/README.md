# Failure experiment: Which invariants survive loss, offline edits, replay and restart?

## Hypothesis

A persistent server log orders writes; durable outboxes retry stable IDs; snapshots repair old cursors. Change the indicated rule in the source; a violated assertion or changed result would overturn the prediction for this model.

## Setup and controls

Source: working tree for this curriculum. Node.js 22.4+. Fixed inputs are visible in [driver](../src/demo.mjs); randomized network schedules use xorshift32 with seed 7, logical milliseconds and event ordering `(time, insertion sequence)`. Do not interpret simulated time as a measured network latency.

## Driver and expected result

From the lab root: `node 20-production-sync-engine/experiments/run.mjs`. The demo's named assertions specify exact expected properties. The local fixture exposes a persistent server log orders writes; durable outboxes retry stable ids; snapshots repair old cursors.

To combine latency, loss, duplication, reordering, disconnect, server restart, stale cursors and concurrent writers, run `node 20-production-sync-engine/experiments/run.mjs`. That driver exercises the integrated protocol. Not every fault is meaningful for a memory-only primitive: a G-Set merge has no socket or server to restart.

## Actual result

Not run in this local document. Repository validation and raw combined observations, when available, are recorded in [the curriculum evidence](../../../experiments/README.md). These are model results, never learner mastery or production throughput measurements.

## Explanation and limitations

One room and one writer process; server-order field replacement, no consensus, authorization, power-loss guarantee or text CRDT integration. A passing example supplies evidence for the stated transition model, not a universal proof. Preserve changed traces when a hypothesis fails.

## Further experiment

Remove one identity/version/context field. Find the smallest counterexample; then restore it and state why it is sufficient under the declared assumptions.
