# Authoring and implementation plan

Status: ready; authoring plan completed. Release review: 2026-10-14, Codex (AI technical/editorial review). Reader and objective: see the master index. Historical scope date: 2026-10-13.

This plan is stated before the guides. It adapts the repository template to a book-sized resource: individual chapters explain their own questions, worked example, alternatives, failures, security boundary, evidence, and open issues. Shared references prevent repeated definitions. A section may be omitted only when its reader need is met by an explicit cross-reference or does not apply.

## Coherent example domain

Mira and Dev edit a shared document in a workspace. The document has a title, text, comments, tags, and permissions. A task refers to the document. A channel contains messages about it. A game arena adds continuously simulated positions. These extensions deliberately change the state model; they do not pretend that text offsets, relational constraints, and physics are interchangeable.

Each example names its actors, initial state, transition rule, network schedule, failure assumptions, observed state, expected outcome, and verification method. ASCII text precedes Unicode; rich text follows plain text; one object precedes cross-object constraints; two replicas precede multi-region deployment.

## Chapter questions and coverage contract

| Chapter | Questions it must answer before substantive completion |
|---|---|
| Foundations | What is shared state? What is an observation contract? Why are concurrent and failed histories ambiguous? What do retries, causal metadata, consistency and coordination establish? |
| Mathematics | How do latency, bandwidth-delay product, Little's Law, retransmission probability, drift bounds, operation algebra and metadata complexity guide concrete decisions? Every equation needs variables, assumptions, derivation where useful, numbers and limits. |
| Conflicts | How do LWW, three-way merge, CAS, version vectors, OT, CRDTs, transactions and human decisions differ in algorithm, correctness, intent, time/space cost and domain fit? Include nested edits, deletion, permissions and dependencies. |
| OT | How do position transforms and pending queues work? Which TP1/TP2 or algorithm-specific obligations apply? How do insert/delete/replace, Unicode and structure change proofs? |
| CRDTs | Why do join or commutativity rules converge? Implement G/2P/OR sets, G/PN counters, LWW/MV registers and maps; explain lists, rich text, tombstones and safe reclamation. |
| Databases | How do ACID, MVCC, locks, conditional writes, serializability, WAL, CDC, primary/multi-primary replication, 2PC and consensus differ? Include SQL histories and whole-transaction retries. |
| Networking | What do IP, TCP, UDP, WebSockets, SSE and polling guarantee? Explain packet identity, congestion, secure transport, NAT/relays and selective reliability. |
| Engine | Who owns each of the 18 lifecycle responsibilities in the request? Trace local write through validation, commit, broadcast, catch-up, snapshots and garbage collection. |
| Messaging | What differs between messages, edits, reactions, typing, presence, receipts and game inputs? Explain durable logs, queues, pub/sub, streams, partitions, groups, fan-out, cursors, backpressure, CQRS and replay. |
| Local-first | What happens after days offline, auth expiry, revocation, migration, deletion and crash? What can an encrypted server validate? Why does local-first not require peer-to-peer? |
| Collaboration | How do text, design graphs, tasks/pages, shared source, execution and terminals differ? Separate persistent state, presence, control authority and confirmed product evidence. |
| Games | How do ticks, frame rate, prediction, reconciliation, interpolation, extrapolation, lag compensation, rollback and lockstep work? Compare all eight requested genres and implement a movement timeline. |
| Local concurrency | How do Java CAS, fetch-and-add, barriers, locks, condition variables, ABA and tagged versions work? Distinguish lock-free from wait-free and local linearization from distributed authority. Investigate k-mer terminology without assuming a connection. |
| Security | Where are authentication, authorization, validation, tenant isolation, replay protection, transport integrity, E2EE and audit enforced? What happens to revoked offline clients? |
| Production | How do gateways, hot partitions, presence, regions, overload, snapshots, rolling versions, storms and disaster recovery behave? Which tests detect wrong histories, rather than only throughput? |
| Handbook | Can a fresh checkout run A–G, verify expected outputs, inject failures and understand simplifications? Include directory maps, critical function walkthroughs, performance limits and hardening. |
| Comparisons | Compare all 11 requested application classes across state, authority, consistency, conflicts, delivery, offline use, latency, durability, failures, security and trade-offs. |
| Synthesis | Can the reader derive a new protocol from invariants and failure assumptions and critically read a paper or implementation? |

## Evidence workflow

Use original papers for established properties; versioned specifications and runtime/database documentation for behavior; responsible-team reports and source code for product internals. Search snippets are leads, not a substitute for reading the relevant source. Record unavailable full text and do not claim its detailed proof has been checked. Citation placement must distinguish an established result from this guide's original illustrative example.

Product facts will carry a date and source. Google Docs, Figma, Linear, Notion, Slack, and Discord are application categories until a primary source establishes a specific implementation. Historical engineering reports are evidence of that historical design, not proof of today's whole architecture.

## Project design and verification

A: versioned record, stale-write rejection, atomic increment, Java CAS, SQL serializable retry.
B: durable transaction for message and idempotency key; reconnect by channel sequence; broker fan-out as an optimization.
C: atomic local update plus outbox; atomic server mutation plus dedup result and change log; snapshot fallback after cursor expiry.
D: choose and pin a CRDT library after current-source research; explain protocol and library-specific limits separately.
E: state-based types first, then observed-remove causal metadata; property checks over deterministic permutations.
F: fixed-step server, sequenced inputs, acknowledged input snapshots, client replay and remote interpolation.
G: seeded fault scheduler; test eventual catch-up, invariant preservation, replay safety and durable commit across real process restarts.

Node examples use JavaScript modules unless TypeScript adds enough value to justify tooling. Pin network dependencies and record versions when installing. PostgreSQL examples identify an explicit supported major version. Java examples identify a JDK version. Tests must include histories that would fail a plausible incorrect implementation. Integration tests must distinguish in-memory simulation from actual disk/process/network boundaries.

## Historical installment ledger

The entries below describe what existed at each installment. Their draft/pending/planned language is historical and is superseded by the [completed release review](REVIEW.md).

First installment covers structure, foundation, shared vocabulary, initial source list and a foundation lab. It does not satisfy the complete masterclass or projects A–G. Full algorithms, product research and production implementations remain outstanding.

Second installment adds the mathematical foundations reference, conflict-resolution guide and a dependency-free lab with 20 passing tests. It covers numerical models, explicit merge policies, causal alternatives, deletion and invariant counterexamples. Full OT/CRDT chapters and projects A–G remain outstanding; the educational lab does not replace durable/networked integration work.

Third installment adds detailed OT and CRDT guides and two runnable labs. OT includes 220 pair cases and a documented TP2 counterexample; CRDTs include a compact dot/context MV register, fixed-key map, retained insertion tree and explicitly limited rich-text marks. Ten OT and 23 CRDT tests passed. These labs do not replace full networked/durable Projects D, E and G; database concurrency and networking are next.

Fourth installment adds database concurrency and networking guides, Project A and a real loopback networking lab. PostgreSQL 18.4 passed 14 SQL scenarios (15 reported tests including the parent); Java 25.0.1 passed embedded CAS assertions; Node networking passed 13 tests. The isolated lab container/volume were removed after validation. Power/storage loss, replication/failover, TLS/QUIC/NAT deployment and the later durable chat/sync engine projects remain outstanding. The next installment is synchronization-engine architecture and messaging, with Project B.

Fifth installment adds synchronization-engine and messaging guides plus Project B. Sixteen reported tests pass on PostgreSQL 18.4, Redis 7.4.3 and Node 26.7.0, including actual gateway SIGKILL before commit and after commit/before ACK. The demo verifies stable-ID replay and incremental catch-up. The client remains memory-only; snapshot reset, actual pruning, broker/database outage, WAN/load tests and production authentication remain outstanding. Next: local-first guide and Project C durable client queue.

Sixth installment adds the local-first guide and Project C. Twenty-five tests pass on Node 26.7.0 / SQLite 3.53.4 with file-backed stores, loopback HTTP and actual client/authority SIGKILL. The protocol reconciles retained outcomes atomically with snapshots, preserves conflicts, checks conditional dependencies, propagates tombstones and fences obsolete epochs. It prunes the change log but retains outcomes; browser storage, implemented migrations, encrypted payloads, safe outcome GC and production identity remain outside the lab. Next: application-specific collaboration architectures and Project D collaborative text.

Seventh installment adds collaboration architectures and Project D using pinned Yjs 13.6.33/ws 8.22.0. Eighteen tests pass with actual WebSockets, SQLite and server SIGKILL before/after commit. The CLI editor demonstrates concurrent offline branches, selective undo, relative anchors, deletion-aware exchange and current document access. Server storage is durable; client state remains memory-only. Historical Figma/Notion reports are explicitly dated; Linear talk and unavailable Google pages are not used to invent current internals. Rich-text/browser bindings, durable client CRDT storage, multi-owner fencing and hostile-encoding validation remain open. Next: multiplayer simulation architecture and Project F.

Eighth installment (2026-10-14) adds the multiplayer guide and Project F. Twenty-four tests pass on Node 26.7.0 with deterministic schedules, actual UDP, application-dropped datagrams and real server SIGKILL/rejoin. Scheduled input ACKs mean finalized slots, including neutral fallback; snapshots repair current state while expired inputs stay expired. The guide derives prediction/reconciliation, interpolation, lag compensation, deterministic lockstep/rollback, interest, compression and eight genre trade-offs. The lab omits Internet security/congestion/NAT, full physics/rollback, graphics and persistence; restart creates a new match epoch. Next: local concurrency primitives and Java examples, including memory ordering, ABA and the k-mer terminology boundary.

Ninth installment (2026-10-14) adds local concurrency and a Java/Node lab. Twenty Java in-process scenarios, one two-JVM boundary check and three Node checks passed. Installed JDK 25.0.1 was used explicitly because shims had no selected default; machine configuration was not changed. Forced schedules expose volatile lost updates, pointer-only ABA, repeated speculative effects and non-atomic pairs; stamped/immutable-state, publication, locks, conditions and permit cases provide contrasted mechanisms. The guide distinguishes linearizability/progress, local/distributed boundaries and k-mer counting with verified Jellyfish primary research. Exhaustive weak-memory/progress, jcstress/JMH and native reclamation remain unvalidated. Next: security and production architecture, including the general failure-testing harness.

Reviewer: Codex (AI technical/editorial review).
Review date: 2026-10-14.
Open issues: none blocking the stated educational release; deployment limitations are recorded in REVIEW.md.

## Installment 10: trust and operational correctness

Security and production guides now cover current authorization, revocation races, tenant scope, replay identities, validation, encrypted-server limits, audit anchors, gateway capacity, owner fencing, overload, compaction, mixed versions, observability, correctness workloads and disaster-recovery boundaries. Project G passes 25 tests on Node 26.7.0 / SQLite 3.53.4: five seeds replayed twice, actual loopback HTTP loss/duplication/partition/delay, transaction aborts and supervised client/server SIGKILL. A normalized trace demonstrates reproducibility and anchored integrity checks. This does not test real TLS/JWT/E2EE, multi-region fencing, OS packet loss, disk/power failure or actual backup restoration. Guides remain draft pending technical review. Next: the implementation handbook, architecture comparisons and final synthesis, including an explicit reconciliation of Project E with the existing CRDT experiments.

## Installment 11: implementation path, comparisons and synthesis

The handbook links runnable setup, source, transition boundaries, expected results, troubleshooting and hardening for A–G. Eleven aligned category rows cover all requested comparison attributes, with authored designs separated from historical implementation evidence. The synthesis derives a maintenance-workspace protocol, traces conflicting offline decisions and unknown success, provides proof obligations and self-assessment criteria. Project E now has a dedicated runnable directory that reuses the 23 CRDT datatype tests and adds seven replication tests: four datatypes × ten seeds replayed twice, total loss/recovery and semantic counterexamples. All planned chapter drafts and A–G paths now exist. This structural milestone does not close independent review or the stated missing production features. The integrated maintenance workspace is a design exercise, not new deployed software.

## Completed release

All eighteen guides and runnable A–G project paths are complete for their declared teaching scopes. [REVIEW.md](REVIEW.md) records the technical/editorial review, substantive corrections, source checks and future validation boundaries. [VALIDATION.json](VALIDATION.json) records 26 successful commands. Status is ready; historical installment statements above are not current outstanding work.
