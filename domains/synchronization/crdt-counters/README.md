# Why does a CRDT counter converge?

Suppose two disconnected clients increment a shared value. A single number is insufficient: two replicas holding 1 might represent the same increment or two different increments. Summing duplicates work; taking the maximum loses independently generated work. Preserve **who generated how many increments** instead.

## State and rule

Use a vector with one component per stable writer identity. Client i increments only component i. Merge two vectors by taking the maximum of each component; read the counter by summing the components.

```text
Initial: A=[0,0], B=[0,0]
Offline: A increments twice → [2,0]
         B increments once → [0,1]
Merge:   max([2,0], [0,1]) = [2,1], value = 3
Repeat:  max([2,1], [2,0]) = [2,1], still 3
```

Each component records monotonic knowledge about one writer. Maximum is commutative, associative, and idempotent. Therefore duplicate and reordered state delivery can produce the same componentwise maximum. This is a **state-based grow-only counter**, not a general text collaboration algorithm.

## Assumptions and guarantee

Writers have unique stable identities, each component has one owner, counts never decrease, and updated information eventually reaches every replica. Under those assumptions, replicas converge to the same vector. A permanently partitioned client can remain stale. Identity reuse after losing local state can lose increments; durable state or a new identity is needed. Merge has no authentication and cannot prevent a malicious writer from lying.

## Build, experiment, and visualize

The [model](implementations/javascript/model.js) has four functions: create, increment, merge, and value. It validates dimensions and JavaScript safe-integer ranges. The [interactive lab](interactive/index.html) supports 2–6 clients, disconnected local edits, queued snapshots, duplicate delivery, dropped snapshots, and arbitrary delivery order. Snapshot delivery is manually controlled; neither endpoint can be offline in this simplified network.

```sh
node domains/synchronization/crdt-counters/experiments/delivery-order/run.js
```

Node.js 18+ runs the [headless experiment](experiments/delivery-order/README.md) against the same merge code. HTML opens directly without installation.

## Try to break the explanation

1. Deliver one snapshot twice. Why does the second delivery change nothing?
2. Drop every message from a writer. Which guarantee no longer applies?
3. Replace maximum with addition. Which invariant fails?
4. Let two clients write the same component. Why can maximum now lose independent increments?
5. Reset a writer to zero and reuse its identity. What happens when old state comes back?

## From counter to collaboration

Text editing adds order, insertion identities, deletion semantics, user intention, metadata growth, and garbage collection. Persistent sync adds queues, durable replica identity, authorization, restart, and reconnect. Presence is often ephemeral state with different requirements from document edits. [Ink & Switch's local-first research](https://www.inkandswitch.com/essay/local-first/) explains why replica mechanisms and application behavior must be considered together.

Related topic IDs: `crdt-sets`, `sequence-crdts`, `causal-order`, `operational-transformation`, `sync-engines`, and `collaborative-editing`; see [the index](../../../INDEX.md). Study OT and CRDTs with explicit example outcomes; convergence alone does not establish desirable editing semantics.
