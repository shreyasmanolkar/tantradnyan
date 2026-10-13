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

## Editing and replicated datatype terms

| Term | Meaning |
|---|---|
| Inclusion transformation | Adjust an operation to a context that includes another operation's effect. |
| Operation context | The state/history in which an operation's coordinates and preconditions are meaningful. |
| TP1 | Pairwise transform obligation that complementary execution paths produce equivalent states. |
| TP2 | Path-independence obligation for transforming a third operation through two equivalent concurrent paths. Applicable paths depend on the control algorithm. |
| Control algorithm | Protocol that selects transformation/delivery contexts and admissible histories around the datatype operations. |
| Confirmed shadow | Client representation of its known authoritative accepted prefix, distinct from speculative visible state. |
| Cursor affinity | Policy deciding whether a boundary stays before or moves after text inserted exactly at it. |
| Dot | Actor/counter identity of one event/write in a specified object/history scope. |
| Causal context | Evidence of observed history, retained even when obsolete values are pruned. |
| Delta-state | Joinable state fragment governed by a delta-CRDT's dissemination/causality rules. |
| Causal stability | Protocol evidence that relevant participants have incorporated required causal history; reclamation also depends on references and return/restore rules. |
| Sequence anchor | Stable element identity used to place another insertion or resolve a position. |
| Grapheme cluster | Unicode segmentation unit approximating a user-perceived character; may contain multiple scalars/code units. |
| Writer incarnation | Exclusive generation of a writer identity whose operation/counter namespace cannot be rolled back or reused. |

## Database and transport terms

| Term | Meaning |
|---|---|
| MVCC | Retain versions and choose visible state through a snapshot rather than forcing every ordinary read to block a writer. |
| SSI | Serializable Snapshot Isolation: snapshot execution plus dependency handling that prevents incompatible committed transaction histories. |
| WAL | Write-ahead recovery/replication log; required log data precedes durable writes of corresponding data pages. |
| CDC | Change-data capture: expose changes for consumers under a defined commit/checkpoint protocol. |
| LSN | Log sequence number/location in WAL; not automatically a complete business transaction cursor. |
| Prepared transaction | Participant state durably ready to follow an external commit/abort decision; can retain locks until resolution. |
| Two-phase commit | Prepare participants, then disseminate a durable global commit/abort decision. Coordinator uncertainty can block progress. |
| Deadlock | Cycle of incompatible resource waits; one participant must release/abort to make progress. |
| TCP stream | Ordered bytes within one connection; application message boundaries and durable effects are separate. |
| UDP datagram | One transport message without built-in reliable ordering/retransmission/congestion control. |
| Framing | Encode and recognize complete application messages despite arbitrary byte-stream chunk boundaries. |
| Flow control | Bound sender traffic by receiver transport capacity. |
| Congestion control | Adapt traffic to the network path's sustainable capacity and congestion signals. |
| Head-of-line blocking | Later deliverable work waits behind earlier missing or unfinished work in an ordered dependency scope. |
| MTU | Maximum transmission unit on a link/path; fragmentation and encapsulation affect payload budgets. |
| RTO | Retransmission timeout, chosen under a protocol's RTT/variance/backoff rules. |
| SSE | Server-Sent Events: HTTP server-to-client event stream with browser reconnect/ID mechanisms. |
| QUIC | Secure multiplexed transport over UDP with reliable streams and specified loss/flow/congestion machinery. |
| STUN / ICE / TURN | Address-discovery/connectivity-check/relay mechanisms used in establishing reachable paths; not application authorization. |

## Engine and messaging boundaries

- **Accepted outcome:** durable result of a logical operation; response delivery may still fail.
- **Outbox:** transaction-coupled publication work retained with the accepted effect. Publication can repeat unless its downstream boundary prevents repetition.
- **Inbox:** unique consumed-event identity committed with a consumer's local effect.
- **Sent cursor:** volatile progress queued by a sender; it does not certify receiver application.
- **Applied checkpoint:** prefix incorporated into a receiver projection; durable recovery requires storing it atomically with that projection.
- **High-water boundary:** source head observed in a particular read, distinct from projection progress.
- **Stream epoch:** generation identifier fencing old cursors after recreation/reset.
- **Publisher confirm:** broker evidence to a publisher; not proof of recipient processing.
- **Consumer acknowledgment:** consumer evidence to its broker under a declared processing policy.
- **Presence lease:** expiring session liveness evidence, not proof that a person is available.
