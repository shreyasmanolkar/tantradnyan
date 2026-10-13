# Glossary — foundational terms

This reference grows with the chapters. Definitions refer to contracts, not product labels.

| Term | Meaning |
|---|---|
| State machine | State plus defined transitions and observable results. |
| Replica | A participant maintaining a representation of the same logical data. |
| Authority | Component or protocol whose decisions determine accepted state in a declared scope. |
| Invariant | Predicate required to hold for every accepted state or history. |
| Safety | Something forbidden never happens. |
| Liveness | Something required eventually happens, under stated progress assumptions. |
| Convergence | Replicas eventually have equivalent logical states after updates stop and required information arrives. |
| Strong eventual consistency | Eventual delivery plus convergence for replicas incorporating the same updates, with termination assumptions. |
| Linearizability | Each completed operation appears to take effect within its invocation/response interval; real-time precedence is preserved. |
| Sequential consistency | One legal sequential history preserves each process's operation order, without requiring cross-process real-time precedence. |
| Serializability | Committed transactions have effects equivalent to a serial transaction execution. |
| Strict serializability | Serializability plus real-time precedence of transactions. |
| Snapshot isolation | Transactions read a snapshot and prevent specified overlapping write conflicts; write skew can remain. |
| Causality | Potential influence through local event order and send/receive paths. |
| Concurrency | No happened-before path in either direction. Not necessarily equal wall-clock time. |
| Idempotency | Repeated application has the same logical effect as one application. |
| Deduplication | Recording identity to suppress repeated handling of one operation. |
| Effectively once | Repeated delivery produces one observable effect within a stated identity, retention and atomicity boundary. |
| Commit | A precisely specified acceptance point; its durability and replication contract must be named. |
| Outbox | Durable pending work committed atomically with the local/business state that creates it. |
| Cursor | Resume token for a declared stream, generation, filter and retention policy. |
| Epoch | Generation identifier distinguishing authority or history incarnations. |
| Fencing token | Increasing authority token checked by the resource that rejects stale actors. |
| Tombstone | Retained evidence of deletion so stale replicas cannot simply resurrect an object. |
| Anti-entropy | Exchange that discovers and repairs differences between replicas. |
| Partition | Communication failure separating participants; distinct from data partitioning. |
| Shard | An assigned subset of a dataset or workload; replicas of a shard copy that subset. |
| Presence | Ephemeral estimate of participation, generally based on heartbeats or leases. |

Corrections to common conflations: message delivery is not commit; convergence is not intent preservation; isolation is not replication consistency; a local CAS is not distributed coordination; a socket is not a durable synchronization protocol.

## Mathematical and conflict terms

| Term | Meaning |
|---|---|
| Bandwidth-delay product | Capacity times feedback delay; estimates data needed in flight to fill a path. |
| Residence time | Time inside a declared queue/service boundary, including the components named by that boundary. |
| Backpressure | Slowing or bounding admission when downstream capacity cannot drain work. |
| Tail latency | High-percentile response delay; averages alone do not describe it. |
| Commutativity | Changing the permitted order of operations or merge inputs preserves the specified result. |
| Join-semilattice | A partially ordered state space where each pair has a least upper bound. |
| Join | Least state above both inputs in the declared information order. |
| Monotonic update | Transition that only advances in the declared information order; visible data may still be deleted. |
| LWW | Last-write-wins: select one candidate by a defined total key, which need not reflect true generation time. |
| CAS | Compare-and-swap/set: atomically check an expected value/version and perform the transition only if it matches. |
| Three-way merge | Compare two branches to their common base and combine one-sided changes or retain conflicts. |
| Write skew | Transactions change different records after mutually incompatible reads, violating a shared rule. |
| Causal frontier | Candidate versions not causally dominated by another known version. |
| Observed-remove | Removal suppresses addition identities it observed; concurrent unseen additions can survive. |
| Domain invariant | Application rule required of accepted states or histories; convergence alone does not enforce it. |
| Conflict resolution | A defined decision to combine, transform, select, retain or reject competing operations/state. |
| Intention preservation | A context-dependent requirement that merged effects reflect specified user operation meaning; deterministic agreement alone does not establish it. |
