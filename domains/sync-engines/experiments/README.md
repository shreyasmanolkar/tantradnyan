# Curriculum experiments and evidence

## Hypothesis

Under valid unique actor/operation identities, a single persisted server history, eventual delivery after recovery, and the declared reducers, all connected clients eventually represent the same accepted field state. Retrying an already committed operation never allocates another sequence or effect. For the CRDT types, joins preserve their algebraic invariants despite delivery permutation/repetition. For the bounded OT pair, transformed paths reach the same text.

These predictions can be falsified by an identity collision, incorrect version/context/merge rule, cursor advanced across a gap, receipt lost independently of effect, or trimming metadata needed by an old client.

## Setup and controls

Run from `domains/sync-engines/sync-engine-lab`:

```sh
npm test
npm run faults
npm run demo
```

Node.js 22.4+; no npm dependencies. Socket checks bind only loopback, choose temporary ports/files and start a bounded child server. Model tests use deterministic initial states; randomized deliveries use xorshift32 with explicit seeds, logical milliseconds and `(time,insertion sequence)` event order. The 100-client scenario is a correctness model, not a network throughput measurement. A final loss-free recovery window supplies eventual delivery explicitly.

The WebSocket restart check kills only the child process created by the test. It does not kill unrelated services or assert host-power-loss durability. TCP/UDP/HTTP/WebSocket checks need an environment permitting localhost binds; the restricted sandbox returned `EPERM`, so those checks ran with the approved socket capability.

## Driver and expected observation

[Named fault driver](../sync-engine-lab/20-production-sync-engine/experiments/run.mjs) runs combined failures, a 500 ms no-random-loss variant, reordering, 10% random loss, 5% duplication, 100 writers, OT/text-CRDT comparison and authoritative game inputs. Every network scenario includes the controlled offline client, server restart and compaction. `drops` counts blocked-endpoint sends as well as random loss, so the zero-random-loss scenario can still report drops.

Expected accepted operation count is `2 × clients + 1`: each client writes shared and private fields, and the offline client writes one additional field. Views/cursors agree and pending outboxes are empty after recovery. Winner selection follows actual server acceptance order. Both bounded text algorithms produce `AXC` for the common-base insert/delete example. Duplicate game inputs apply once.

[Properties](../sync-engine-lab/shared/tests/properties.test.mjs) include all 49 valid OT edit pairs on `ABC`, CRDT join laws and delivery permutations for eight types, framing split points/Unicode, observed-remove semantics, missing text ancestors, file-backed receipt recovery, save failure, stale snapshots, leases, 20 seeded schedules and an actual process restart. [Supplemental checks](../sync-engine-lab/shared/tests/supplemental.test.mjs) include real HTTP carriers/workers and modeled routing, stream isolation, selective ACKs and fencing.

## Actual observation

Observed in [run 20261006T210329Z-curriculum-validation](results/20261006T210329Z-curriculum-validation/README.md): **43 tests passed**, none failed/cancelled/skipped. The fault driver exited 0. Three-client variants ended at head 7; the 100-writer variant ended at head 201; each had converged views, matching cursors and empty pending outboxes. OT and sequence-text model both yielded `AXC`. See raw [test output](results/20261006T210329Z-curriculum-validation/tests.log) and [fault output](results/20261006T210329Z-curriculum-validation/faults.log).

The source/runtime/environment are recorded with the run. Test-runner wall-clock durations are incidental functional-check output; they are not performance results. These observations verify bounded code properties, not learner mastery, universal convergence under invalid states, unrestricted OT correctness or production capacity.

## Catalog validation boundary

The repository-wide catalog already referenced a missing `domains/synchronization/crdt-counters` topic, implementation, browser manifest and historical experiment result before this curriculum's catalog update. `scripts/lab.py build` refuses generation while those catalog artifacts are absent; `check --generated` also reports pre-existing local references to them. The new guide uses its requested path and a catalog entry-point page at `domains/synchronization/sync-engines`. No missing historical result was fabricated and no learner verification states were changed.

The final run records the exact build/check errors and confirms separately that the new curriculum has no broken local file links. Regeneration remains blocked by the existing missing topic.

## Explanation and limits

The evidence supports the named state transitions under the test inputs/fault schedules. It does not prove unbounded behavior, browser editor correctness, adversarial-client safety, kernel TCP compliance, QUIC/WebRTC implementation, consensus, multi-region failover or power-loss-safe persistence. The final map engine orders stale writes rather than preserving text intentions; text and game branches are separate toys. Receipt/tombstone metadata grows, and snapshot/log replies are bounded unpaged frames.

## Next experiments

1. Introduce a server save failure immediately before ACK; retain the trace and confirm no accepted state is published.
2. Define a receipt/actor retirement horizon, then reconnect a replica outside it.
3. Replace field resolution with rejection and explicit conflict-copy UI state.
4. Add paginated snapshots with a captured consistent cut; verify updates racing with bootstrap cannot be skipped.
5. Implement full text integration only after defining its context/identity/undo semantics.
