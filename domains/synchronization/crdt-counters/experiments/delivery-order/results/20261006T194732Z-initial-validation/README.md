# Initial deterministic verification

Recorded 2026-10-06 UTC. Runtime: Node.js v26.7.0. Source: the newly scaffolded uncommitted working tree; no commit ID existed. Inputs: snapshots `[2,0,0]`, `[0,3,0]`, and `[0,0,1]`. No network, wall-clock, or random inputs were involved.

Command from repository root:

```sh
node domains/synchronization/crdt-counters/experiments/delivery-order/run.js
```

Observed output:

```text
Delivery 0 → 1 → 2 (then duplicated): [2,3,1], value 6
Delivery 0 → 2 → 1 (then duplicated): [2,3,1], value 6
Delivery 1 → 0 → 2 (then duplicated): [2,3,1], value 6
Delivery 1 → 2 → 0 (then duplicated): [2,3,1], value 6
Delivery 2 → 0 → 1 (then duplicated): [2,3,1], value 6
Delivery 2 → 1 → 0 (then duplicated): [2,3,1], value 6
Counterexample: sum-merge duplicates one writer's 2 increments into [4,0,0].
PASS: six orders, duplicates, finite merge properties, validation, and the incorrect-rule counterexample.
```

The finite merge checks examine 27 vectors (all three-component vectors with entries 0–2), including all pairs for commutativity and all triples for associativity. Validation and safe-integer exhaustion cases also passed. Exit code: 0.

These observations agree with the max-merge algebra. They do not prove eventual delivery or safe writer identity reuse. Next investigation: deliberately share a writer component and show the independent updates that maximum loses.
