---
title: "Architecture comparisons: choose guarantees by state and invariant"
status: draft
audience: "Engineers comparing application architectures after studying the mechanisms"
prerequisites: ["Consistency, conflict resolution, engine lifecycle, application chapters and security"]
last_reviewed: 2026-10-14
technical_scope_as_of: "Authored reference designs; historical product evidence explicitly dated"
asd_ste_reference: "Plain-language principles only; no formal compliance claim"
---

# Architecture comparisons

## 1. Reader, scope and evidence labels

You can explain OT, CRDT joins, transactions and prediction. You need to choose which mechanism owns which kind of state, rather than choose one technology for a whole product. This guide answers: what must agree; who decides; where can conflict be tolerated; which information expires; what must survive; and which security/latency costs follow?

The tables are **reference designs**, not a survey claiming that named products use each listed implementation. They cover the eleven requested categories and split their attributes across aligned tables so each row remains readable. Financial/inventory examples are state-invariant exercises, not jurisdiction-specific compliance advice or a deployable accounting system. Measurements and capacity claims require an actual workload; latency descriptions below are qualitative requirements.

Evidence labels:

- **Theory:** an algorithm's established property under its stated model; see the corresponding mechanism chapter and bibliography.
- **Source-backed implementation:** a dated, scoped report or inspected implementation, never an inferred whole current product.
- **Reference design:** an authored architecture option whose fit follows from the stated constraints.
- **Unknown:** evidence is insufficient to identify a product's current private mechanism.

The category matrices below use the reference-design label throughout. A separate evidence table records confirmed examples.

## 2. Read the state before reading the table

A document may contain mergeable text, conditionally updated status, authoritative permissions, immutable chat messages and ephemeral cursors. These differ even if one socket carries them. Durable intent normally survives disconnection; a typing signal loses value after seconds; movement input loses value after its simulation slot. The [engine](../08-sync-engine/README.md) provides capture, identity, persistence and recovery, while each domain supplies its transition and invariant.

The phrase “authoritative component” means the component allowed to decide a particular fact. A CRDT replica may contribute valid content evidence without owning access control. A game client may predict motion without deciding a hit. A database may commit a record without deciding what two offline sentences ought to mean. Split these authorities explicitly.

## 3. State, authority, consistency and conflicts

| Category | Primary replicated state | Authority / decision owner | Required observations and invariants | Conflict strategy and its limit |
|---|---|---|---|---|
| Collaborative text editor | Character/structure evidence, marks, comments; separate presence | OT document sequencer or CRDT contributors plus authorized durable provider | Compatible histories converge; valid structure; local speculative edits distinguishable from confirmed acceptance | OT context transforms or sequence CRDT; rich-text boundaries, deletion and undo need explicit semantics |
| Design tool | Object/property graph, layer order, geometry; separate cursor/selection | Document owner for accepted property/structural decisions; clients speculate | Coherent graph, bounded visual discontinuity, deterministic same-property outcome | Property-level replacement/merge; moves and cycles need structural policy; scalar LWW alone cannot preserve relationships |
| Project-management application | Tasks, statuses, links, comments, ranks, embedded text and ACLs | Record/domain transaction owner; text may use separate provider | Valid lifecycle and relations; current permissions; session freshness; optional offline intents | CAS for dependent decisions, atomic counters/sets where appropriate, text CRDT/OT, explicit rejected-intent review |
| Chat and messaging | Messages, channel sequence, revisions, reactions, read watermark; transient typing | Durable per-channel submission owner and membership authority | One accepted effect per submission identity; ordered catch-up within channel; no assumed global order | Append identity + scoped sequence; conditional edits/deletes; uniquely keyed reactions; read watermark max over valid incorporated positions |
| Local-first application | Durable local records/evidence, outbox, confirmed projection and pending intent | Local replica owns private work; remote policy owns shared acceptance, or valid peer membership owns accepted evidence | Offline usability, crash-safe intent, eventual dissemination, explicit permission/schema/source discontinuity | Datatype merges or server conditional writes; private conflicts retained; long-offline retries bound by retention/reset policy |
| Competitive multiplayer shooter | Inputs, authoritative entities, snapshots, bounded historical hit-test state | Dedicated match simulation and hit-validation owner | Responsive local prediction, authoritative damage, bounded rewind/fairness policy | Latest authoritative timeline plus reconcile/replay; no indefinite input merge; client hit assertions are untrusted |
| Fighting game | Frame-indexed inputs, full rollback state, confirmed frame horizon | Deterministic peer agreement or server-mediated/refereed input/state policy | Same deterministic state from same input prefix; bounded rollback and disconnect policy | Predicted remote input replaced by actual input then replay; authority/fairness must be designed separately from determinism |
| Real-time strategy | Turn/frame commands, world state and deterministic hashes | Ordered command coordinator; deterministic participants, with server validation/referee as needed | Same command prefix yields same world; divergence detection; acceptable command latency | Lockstep input ordering or authoritative replication; no generic text merge for resource consumption |
| MMO system | Spatial entities, zone transitions, character state and durable economy | Zone simulation owners plus durable account/economy transaction owners | Plausible nearby state; persistent assets/inventory invariants; safe cross-zone handoff | Transient snapshot repair; durable transactions/conditional transfers with stable IDs; split ownership must prevent duplicate assets |
| Financial or inventory system | Ledger/reservations, balances, item ownership, transaction outcomes | Transactional invariant owner; replicated database/consensus as required | No duplicate transfer, conserved value/allowed stock, durable audit; exact invariant determines isolation | Conditional atomic transitions, Serializable or coordinated ledger transactions; offline allocation only with bounded delegated rights |
| Collaborative coding environment | Source text, filesystem/workspace, process/terminal streams and control grants | Text provider plus workspace host/execution authority | Source convergence; explicit save/run revision; execution and terminal control separately authorized | Text OT/CRDT; conditional filesystem saves; serialized process input/control; output stream replay needs its own retention model |

Strong eventual convergence is useful for editor evidence; serializable decision execution is useful for cross-record invariants. Neither replaces the other. Snapshot Isolation can allow write skew; PostgreSQL 18 documents the distinction and Serializable retry requirements in its [isolation reference](https://www.postgresql.org/docs/18/transaction-iso.html). These rows do not imply that every record in a financial system needs a global total order.

## 4. Delivery, offline behavior and persistence

| Category | Transport / messaging pattern | Offline policy | Latency sensitivity | Persistence obligation |
|---|---|---|---|---|
| Text editor | WebSocket/SSE notifications with durable provider catch-up; snapshots/deltas | Local evidence/outbox if supported; reconnect supplies missing history | Immediate local edit; remote lag noticeable; convergence depends on delivery | Document evidence, original pending work, compatible snapshot/history and version history policy |
| Design tool | Bidirectional changes, batching; presence can be coalesced | Private edits replay/merge subject to structural acceptance policy | Smooth local dragging; remote object updates prioritized | Accepted graph and recovery history; cursors/selection normally expire |
| Project management | Push invalidation/change stream plus paged record catch-up | Queue intents; reject or review stale dependent transitions | Local responsiveness; exact shared decision can await authority | Records, accepted outcomes, dependency/conflict evidence; feeds derived or durable by contract |
| Chat | WebSocket/SSE/live gateway, database history, broker wake-ups/fan-out | Queue submissions; reconnect by channel epoch/sequence | Fast arrival valuable; durable catch-up more important than retaining stale typing | Accepted messages and edits/deletes; idempotency horizon; valid unread/read checkpoint |
| Local-first | Push/pull anti-entropy, snapshots/operation log; peers optional | Core requirement: durable useful work with bounded permission/schema caveats | Local action independent of RTT; reconciliation cost after long absence | Local state/outbox/identity plus accepted shared evidence and safe retention |
| Shooter | Congestion-aware UDP/QUIC datagrams for motion; selective reliable control | Match disconnection/rejoin; stale movement not an offline queue | Prediction hides RTT; jitter/buffer/rewind affect fairness | Match audit/replays by policy; account rewards durable separately |
| Fighting game | Input redundancy/selective reliability; peer relay or server path | Pause/timeout/forfeit/rejoin rules; confirmed timeline cannot be silently forked | Few frames change feel; rollback budget limits prediction | Input log/full checkpoints as needed for rollback/replay; results durable separately |
| RTS | Reliable ordered command exchange; deterministic snapshots for resync | Offline single-player branch is a separate session; live match has wait/drop policy | Input delay vs deterministic progress; stalls visible | Ordered command history/checkpoint/replay; match results separately durable |
| MMO | Interest-filtered snapshots plus reliable lifecycle/economy control | Disconnect character policy; durable account state catch-up | Nearby motion sensitive; distant state lower priority; trades need exact decisions | Account/inventory durable; region/world durability chosen explicitly |
| Financial/inventory | Request/response transactional commands; durable event/outbox replication | Local draft only unless safely allocated rights permit disconnected action | Tail latency matters; invariants can require waiting/unavailability | Accepted ledger/outcomes, audit/backup, policy-defined durable commit |
| Collaborative coding | Editor provider, remote host RPC, terminal/exec streams | Source may branch offline; live hosted execution requires host connectivity | Local typing immediate; terminal interactive latency noticeable | Source revisions/host filesystem by contract; process/terminal replay and secrets policy distinct |

Transport names do not certify the application contract. WebSocket supplies a live connection, not durable replay or semantic merging. UDP supplies datagrams, not congestion handling or reliable authority. Internet UDP designs need the responsibilities in [RFC 8085](https://www.rfc-editor.org/rfc/rfc8085.html); game movement and durable reward submission can therefore use different delivery policies over different channels.

## 5. Failure, security and main trade-offs

| Category | Typical failure symptoms | Security requirements | Main architectural trade-off |
|---|---|---|---|
| Text editor | Position drift, missing dependencies, deleted text resurrection, lost private branch | Current document access, bounded decoding, markup sanitization, private-branch protection | Central sequencing/control history vs decentralized merge metadata and compaction |
| Design tool | Cyclic parent graph, displaced layers, overwrite during drag, stale selection | Object/document visibility, validated geometry/graph operations, resource bounds | Cheap field merging vs transaction-like structure/move semantics |
| Project management | Invalid status transition, dangling relation, duplicate rank, silent stale overwrite | Tenant/object/field permissions; invariant enforcement outside editable ACL content | Offline acceptance vs coordinated dependent decisions |
| Chat | Duplicated messages, channel gaps, missed edits, incorrect unread count | Current membership before history/replay, message scope, abuse limits and safe rendering | Cheap transient fan-out vs durable history and catch-up cost |
| Local-first | Queue loss, unknown old success, schema refusal, source epoch change | Offline key/credential handling, current shared acceptance policy, revocation limits | Long offline horizon vs retention, migrations, permission changes and history GC |
| Shooter | Correction spikes, stale rewind, spoofed input, missed entity lifecycle | Validate input timing/rate/feasibility; authoritative hit/damage; encrypted/authenticated session | Local responsiveness vs authoritative correction; rewind favors delayed observations within a fairness bound |
| Fighting game | Excess rollback, desync, stalled confirmation, peer manipulation | Trusted input authorship, deterministic verification/referee model, session abuse bounds | Input delay vs rollback artifacts; peer cost vs authority/anti-cheat |
| RTS | Deterministic divergence, command stalls, cheating through hidden world data | Command validity; avoid exposing hidden state where confidentiality matters; referee if needed | Low command bandwidth vs deterministic complexity, slow participant and information exposure |
| MMO | Duplicate cross-zone entity, lost transfer, stale economy, hot zone overload | Account/economy authority, interest authorization, transfer fencing, tenant/world isolation | Spatial scaling vs handoff consistency and persistent economy coordination |
| Financial/inventory | Double debit/reservation, write skew, unknown commit, incompatible recovery | Every writer constrained, least privilege, authorization and audit, replay scope | Availability/latency during partitions vs strict global constraints; escrow narrows scope when applicable |
| Collaborative coding | Saved code differs from executed revision, duplicate terminal input, lost host | Separate read/edit/run/debug/terminal capabilities; host isolation and secret protection | Shared convenience vs execution authority, reproducibility and private environment exposure |

A mergeable state does not imply a safely mergeable business decision. For example, two devices each reserving the last unit preserve their local rule but violate global nonnegative stock after a PN-counter merge. A bounded-rights design can let each disconnected participant spend only its allocation; changing allocations requires a safe transfer protocol. If no rights remain, availability of a successful reservation cannot be promised.

## 6. Confirmed examples and unknown product internals

| Evidence | What it establishes | What it does not establish |
|---|---|---|
| [Figma, Evan Wallace, 2019-10-16](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) | Historical document WebSocket/client-server design, per-object property updates, server ordering of same-property changes and distinct non-document synchronization | Current full Figma architecture, all graph invariants or a universal CRDT definition |
| [Yjs update API](https://docs.yjs.dev/api/document-updates), checked 2026-10-14; Project D pinned 13.6.33 | Library update application/encoding model and provider-facing APIs; local project demonstrates its scoped use | Google Docs/Notion internals, whole app authorization/durability or interoperability with arbitrary providers |
| [FoundationDB SIGMOD 2021 paper](https://www.foundationdb.org/files/fdb-paper.pdf) | A documented transactional distributed database design and deterministic simulation testing approach | A property of every database, an actual validation of these labs at cluster scale or a whole financial application |
| Repository Projects A–G | Inspected authored code and their recorded finite tests under explicit boundaries | Production performance, complete hostile-client coverage, audited storage durability or proprietary deployment experience |

The Figma author's statement about “true CRDTs” reflects that report's terminology. CRDTs can be deployed through central servers; centralization does not invalidate their algebra. The useful engineering fact is which ordering/merge obligations the reported implementation delegates to its server. Do not generalize the report's property replacement rule to text, financial records or arbitrary nested graphs.

Historical Notion/Live Share evidence and unavailable Google pages are recorded in [collaboration evidence notes](../11-collaboration/RESEARCH.md). No current private Slack, Discord, Linear, Notion or Google Docs conflict algorithm is asserted here. A service's visible instant update cannot reveal whether its internal mechanism is OT, CRDT, conditional replacement or an authoritative log.

## 7. Worked selection: task, text, presence and stock

Assume a workspace contains a shared task title/body, status, online cursors and a reservation for one physical item. Mira and Dev disconnect at task version seven and stock one.

1. Model body text as evidence supporting concurrent inserts. Choose a pinned CRDT/provider or a complete OT control algorithm; evaluate offline horizon and metadata/transform history.
2. Model title as a conditional scalar if silent replacement is unacceptable. Both offline title changes retain their base version. One can be accepted; the stale intent remains visible for revision. An MV register is an alternative if concurrent alternatives should be part of the shared model.
3. Model status transitions against current lifecycle predicates. A generic scalar winner may produce a forbidden transition; choose a conditional/transactional owner for those predicates.
4. Treat cursors as expiring session state. Coalesce updates and discard stale sessions rather than durably replaying every mouse movement.
5. Model item reservation as a conditional decrement under one invariant boundary, or allocate exclusive spend rights before disconnection. Two generic PN decrements do not enforce stock.
6. Scope authentication/authorization and replay outcomes to the workspace/object. Reconnect installs confirmed state plus reconciled pending outcomes; it cannot let an offline ACL edit grant access.

Verification: run E's stock counterexample, A's final-unit reservation scenario and C's conflicting offline title test. Expected outcomes differ: mergeable evidence converges; one unauthorized over-allocation is prevented; stale intent is preserved rather than silently accepted. These independent tests exercise the relevant mechanisms; they do not constitute an integrated workspace application.

Variation: a public brainstorm considers a title replacement harmless. A server-ordered field replacement may be sufficient and cheaper than storing alternatives. Record that product policy explicitly. Changing the tolerance for lost intent changes the fit without changing the networking protocol.

## 8. How to use a matrix without turning it into a recipe

Start with a transition's invariant, determine whether independently valid concurrent decisions can jointly violate it, and identify the scope that must coordinate. Then select allowed observations, delivery/retention horizon, identity and recovery protocol. Finally choose transport and rendering strategy. The [synthesis](../18-synthesis/README.md) walks through those steps with a new design.

If a table cell appears contradictory, split the state further. An MMO can accept approximate movement while requiring exact inventory ownership. A local-first editor can merge text while denying a revoked submission. A coding environment can share text without allowing process control. Whole-product labels hide these boundaries.

Design rules: compare mechanisms against identical histories; name the state and authority; separate required guarantees from observed implementation; qualify offline support by operation; measure actual workloads; test domain/security invariants as well as convergence.

Reviewer: pending technically informed reader. Review date: pending. Open issues: independent technical review and broader current product evidence. These are bounded reference designs, not measured architectures or deployment recommendations for a particular vendor.
