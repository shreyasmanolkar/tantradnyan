# Does merge order matter?

## Hypothesis

All delivery orders of snapshots `[2,0,0]`, `[0,3,0]`, and `[0,0,1]` converge to `[2,3,1]`. Repeated state delivery does not change this result. Adding received state instead of taking the maximum counts duplicates again.

## Setup and driver

Node.js 18+; deterministic vectors; fixed writer identities; no clocks, random losses, persistence, or real networking. Run from the repository root:

```sh
node domains/synchronization/crdt-counters/experiments/delivery-order/run.js
```

The [driver](run.js) tries all six delivery orders, tests duplicate delivery, and exhaustively examines associativity/commutativity/idempotence on vectors whose three components are 0–2. It also checks vector mismatch, invalid values, writer bounds, and arithmetic exhaustion.

## Expected result

Every order yields vector `[2,3,1]` with value 6. Duplicating `[2,0,0]` under an incorrect sum-merge gives value 4 instead of 2. Checks pass for the valid max-merge rule.

## Actual result

The [initial verification record](results/20261006T194732Z-initial-validation/README.md) contains observed outputs and passing checks under Node.js v26.7.0. Learner milestone outcomes remain unverified. Record a new run when changing an assumption or merge rule.

## Interpretation and limits

The finite property checks can reveal a bug but do not constitute a proof over unbounded integers. The algebra of maximum provides the general argument. Delivery scenarios examine convergence after information is delivered; they do not prove liveness under arbitrary network failures.

## Further experiments

Let two clients share a writer identity, introduce a decrement, or lose a writer's persisted count. Decide which assumption changed before choosing another data type.
