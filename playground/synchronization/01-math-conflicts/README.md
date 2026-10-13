# Quantitative and conflict lab

Status: educational implementation; no dependencies. Requires Node.js 18 or later and uses `node:test`. Imports the foundation lab's componentwise vector comparison.

From repository root:

```sh
node playground/synchronization/01-math-conflicts/demo.mjs
node --test playground/synchronization/01-math-conflicts/model.test.mjs
```

To see individual test names if a runner summarizes at file level:

```sh
node playground/synchronization/01-math-conflicts/model.test.mjs
```

## Architecture and design

```text
01-math-conflicts/
  model.mjs         pure/synchronous models and input checks
  demo.mjs          histories and numerical outputs
  model.test.mjs    counterexamples, boundary cases and finite algebra tests
  README.md         walkthrough, scope and expected results
```

The [math reference](../../../guides/synchronization/02-mathematics/README.md) derives the calculation assumptions. The [conflict guide](../../../guides/synchronization/03-conflict-resolution/README.md) defines the concurrency policies and domain constraints. This lab adds no socket, storage or asynchronous timing simulation. It is preparation for Projects A–G rather than a substitute for them.

Expected demo output:

```text
100 packets, 1% loss: 63.397% chance of a loss
5% request/ack loss: 1.108 mean attempts
2000/s at 75ms: 150 operations in flight on average
20ppm after one hour plus 5ms: 77ms uncertainty
LWW: earlier wins under a skewed clock
clean field merge: [18,12], valid=false
causal title alternatives: Plan, Proposal
remove vs unseen add: urgent
```

## Critical functions

`retryModel` includes loss of the request and acknowledgment under an independent constant-probability model. Its `unacknowledged` field does not mean “not applied.” It explicitly handles total loss without claiming eventual progress. `occupancy` and `clockBound` take seconds, so convert milliseconds first.

`lww` compares stamp, actor and identity with a fixed ASCII identity convention. It receives stamps; it does not generate physical or logical time. Equal keys with different values are rejected. Reusing an operation ID under a different ordering key requires envelope validation at the protocol boundary; this standalone max selector cannot discover every such reuse without extra history.

`threeWay` accepts full flat records of finite JSON scalar values. A missing own key means deleted, not omitted by a patch. It returns a partial null-prototype object plus a conflict list. Commit only after resolving all conflicts and validating domain invariants. It rejects nested structures and deliberately does not implement a line, rich-text or arbitrary JSON merge.

`addWrite`/`mergeWrites` retain all immutable write evidence. `frontier` projects those not dominated by another write's complete vector. When a resolution arrives before old candidates, its vector still suppresses them once they arrive. This grow-only representation intentionally keeps every old payload and is not a compact production MV-register. IDs and equal-length complete vectors must remain valid across the history.

`removeObserved` captures currently visible addition IDs. `applyRemoval` handles the captured IDs at any replica without deleting concurrent unseen additions. `mergeOR` unions evidence; old removed additions remain absent even when replayed. All resulting states are treated as immutable by callers; raw maps are not hardened immutable/wire objects.

## Walkthrough and failure variations

1. Run the demo and check the numbers against the guide calculations.
2. Inspect the clean schedule merge: zero field conflicts coexist with invalid `start>end`. Add a domain validation/review step; do not alter the merge to hide the violation.
3. Inspect the two title vectors `[1,0]` and `[0,1]`: neither dominates. Add resolution `[2,1]` and confirm both leave the visible frontier.
4. Remove a tag while a disconnected replica adds the same tag under a fresh identity. Merge either way; the unseen addition survives.
5. Deliver a removal for `S:1` before receiving its addition. The later addition stays hidden. Discarding that tombstone would resurrect it.
6. Run tests: three-candidate LWW permutations, bounded join-law triples, duplicated/delayed causal histories, stale identity rejection, missing/null distinction and unsafe schedule construction.

Variations that should change outcomes: use an LWW policy on the title to discard one candidate; remove the observed-remove tombstone before replay; blindly commit a syntactically clean schedule. Each demonstrates a changed contract or a bug, not better convergence.

## Performance and production requirements

The probability calculations are constant-time arithmetic. LWW stores one candidate. Flat merging scans the union of fields and sorts keys for stable output. The retained-write projection compares all pairs and their vectors; history grows forever. This lab's OR merge clones state repeatedly while adding entries, so its immutable construction can take quadratic work even though a direct bulk-union implementation can be linear in evidence. Tests check bounded fixtures, not asymptotic speed.

Production work requires durable operation identities/results, crash-safe transactions/outboxes, schema and protocol versions, validated envelopes, bounded payload/history sizes, tenant authorization, safe compaction/reset, migration and actual process/network failure tests. Algebraic convergence does not establish these boundaries. No performance measurements or production-readiness claims are made.

Validation record: 2026-10-13, Node.js v26.7.0: demo output matched all eight documented lines; direct execution of `model.test.mjs` reported 20 passing tests, zero failures. Checks cover finite fixtures and deterministic schedules, not disk/network guarantees.

Release review: 2026-10-14, Codex (AI technical/editorial review). Status: ready for this exercise's stated scope. [Review and rerun evidence](../../../guides/synchronization/REVIEW.md) record the actual checks; production-hardening limitations above still apply.
