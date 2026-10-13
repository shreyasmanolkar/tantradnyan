# Synchronization, distributed state, and multiplayer systems

Status: **draft; installments 1–10**. Evidence checked: 2026-10-14. This index distinguishes written material from planned material. The full masterclass is not yet complete.

## Reader, objective, and boundary

You are a computer engineer comfortable with functions, data structures, basic networking, and ordinary database queries. You need to derive architectures from constraints, implement synchronization protocols, and diagnose their failures. No prior knowledge of distributed consistency, OT, or CRDTs is assumed.

The common problem is how independent state machines exchange information and decide what users may observe. The course follows that problem through databases, collaborative applications, messaging, offline software, and games. It includes correctness arguments, runnable experiments, and operating procedures. Detailed graphics rendering, compiler construction, game design, and biological sequence analysis are outside the boundary except where they affect synchronization.

Central questions:

1. What is shared, who may change it, and which rules must always hold?
2. What can each participant know after a delay, disconnection, or crash?
3. Which histories may a reader observe, and when is an update committed?
4. How do retries avoid repeated effects, and how does a client catch up?
5. Which concurrent operations commute, require transformation, or need coordination?
6. How do protocols preserve authorization, recover durable history, and evolve?
7. Which latency and scale costs follow from the chosen guarantees?
8. How do we test those guarantees against failures, rather than only measure speed?

## Efficient learning order

Start with state transitions and failure ambiguity. Learn causality before conflict detection. Learn consistency before choosing a merge algorithm. Study database atomicity before implementing durable acknowledgments. Learn transport behavior before interpreting latency hiding in editors or games.

| Stage | Documents and purpose | Status |
|---|---|---|
| 0 | [Project plan](PROJECT-PLAN.md): document boundaries, requirements, evidence and review policy | Written |
| 1 | [Distributed state](01-distributed-state/README.md): unified model, failures, retries, clocks, consistency, coordination, design choices | Written; draft |
| 2 | [Mathematical foundations](02-mathematics/README.md): quantitative reference; proofs, queueing, reliability, bounds and complexity | Written; draft |
| 3 | [Conflict resolution](03-conflict-resolution/README.md): compare merge policies using identical histories and domain invariants | Written; draft |
| 4 | [Operational transformation](04-ot/README.md): transforms, TP1/TP2, client/server control, Unicode and structured text | Written; draft |
| 4 | [CRDTs](05-crdts/README.md): semilattices, datatype implementations, causal context, sequences, rich text and reclamation | Written; draft |
| 5 | [Database concurrency](06-database-concurrency/README.md): transactions, MVCC, CAS, WAL, replication, consensus and distributed commit | Written; draft |
| 5 | [Networking](07-networking/README.md): TCP/UDP, web transports, QUIC, framing, congestion, secure establishment and NAT | Written; draft |
| 6 | [Synchronization engine](08-sync-engine/README.md): mutation lifecycle, durable queues, cursors, recovery, protocol evolution and ownership | Written; draft |
| 7 | [Messaging](09-messaging/README.md): durable chat, ephemeral events, brokers, ordering, fan-out and recovery | Written; draft |
| 7 | [Local-first software](10-local-first/README.md): durable offline work, snapshots, dependencies, retention, migrations, permissions and encryption | Written; draft |
| 7 | [Collaboration architectures](11-collaboration/README.md): text, design graphs, tasks/pages, shared code, execution and terminals | Written; draft |
| 7 | [Multiplayer systems](12-multiplayer/README.md): authoritative ticks, prediction, interpolation, lag compensation, rollback and eight game genres | Written; draft |
| 8 | [Local concurrency](13-local-concurrency/README.md): Java atomics, publication, locks, ABA, progress and distributed boundaries; k-mer clarification | Written; draft |
| 8 | [Security](14-security/README.md): trust boundaries, revocation, tenant isolation, replay, validation and audit | Written; draft |
| 9 | [Production](15-production/README.md): scaling, regional deployment, overload, observability, recovery and correctness testing | Written; draft |
| 9 | `16-handbook/README.md`: executable projects A–G, setup, tests, walkthroughs and hardening | Planned |
| 10 | `17-comparisons/README.md`: application architecture matrices with evidence labels | Planned |
| 10 | `18-synthesis/README.md`: derive a new architecture and read unfamiliar systems independently | Planned |
| Reference | [Notation](NOTATION.md), [glossary](GLOSSARY.md), [bibliography](BIBLIOGRAPHY.md), [dependency map](DEPENDENCIES.md) | Written; expands with chapters |
| Experiment | [Foundation lab](../../examples/synchronization/00-foundations/README.md): lost updates, retries, causal comparisons and noncommuting text edits | Runnable source and tests written; see validation record |
| Experiment | [Math/conflict lab](../../examples/synchronization/01-math-conflicts/README.md): quantitative models, LWW, three-way merge, causal frontiers and observed-remove tags | 20 tests passed; memory-only |
| Experiment | [OT lab](../../examples/synchronization/02-ot/README.md): pairwise transforms, bounded round, cursors and TP2 counterexample | 10 tests passed; 220 pair cases |
| Experiment | [CRDT lab](../../examples/synchronization/03-crdts/README.md): sets, counters, registers, maps, sequences and explicit rich-text marks | 23 tests passed; memory-only |
| Project | [A: versioned store](../../examples/synchronization/a-versioned-store/README.md): PostgreSQL transactions/replay plus Java CAS | 14 SQL scenarios passed; Java assertions passed |
| Experiment | [Networking lab](../../examples/synchronization/04-networking/README.md): TCP framing/reconnect, UDP loss/retry and stale snapshots | 13 tests passed; real loopback sockets |
| Project | [B: durable chat](../../examples/synchronization/b-durable-chat/README.md): WebSockets, transactional acceptance, Redis hints and reconnect history | 16 tests passed; actual gateway crash/restart |
| Project | [C: offline engine](../../examples/synchronization/c-offline-engine/README.md): SQLite outbox, retained outcomes, snapshot fallback and review | 25 tests passed; actual client/authority crashes |
| Project | [D: collaborative text](../../examples/synchronization/d-collaborative-text/README.md): Yjs, durable provider, undo and relative cursor presence | 18 tests passed; actual WebSockets/server crashes |
| Project | [F: multiplayer simulation](../../examples/synchronization/f-multiplayer/README.md): scheduled UDP inputs, prediction/replay, interpolation and fault schedules | 24 tests passed; actual UDP/server crash and logical adverse links |
| Experiment | [Local concurrency lab](../../examples/synchronization/05-local-concurrency/README.md): forced Java schedules, process boundary and Node shared workers | 20 Java scenarios + 1 JVM-boundary check; 3 Node checks passed |

| Project | [G: failure harness](../../examples/synchronization/g-fault-harness/README.md): seeded schedules, HTTP faults, SQLite aborts and supervised crashes | 25 tests passed; local boundaries |

Read stages 1–3 before choosing OT or CRDTs. Read both algorithm chapters to compare them. Database and networking chapters can then be studied independently. The practical path interleaves A with databases, B with messaging, C with the engine, D with editing, E with CRDTs, F with games, and G throughout.

## Proposed repository structure

```text
guides/synchronization/
  README.md                 master index and progress
  PROJECT-PLAN.md           scope, questions, evidence and deliverable contract
  NOTATION.md               shared symbols and evolving example domain
  DEPENDENCIES.md           prerequisite graph and implementation dependencies
  GLOSSARY.md               concise definitions and conceptual distinctions
  BIBLIOGRAPHY.md           annotated primary-source reading path
  01-distributed-state/
    README.md               foundational guide
    RESEARCH.md             evidence boundaries and review gaps
  02-mathematics/            quantitative reference and evidence notes
  03-conflict-resolution/   merge policies, worked histories and evidence notes
  04-ot/                   transformation and control guide; evidence notes
  05-crdts/                convergent datatype guide; evidence notes
  06-database-concurrency/  durable decisions, replication and evidence notes
  07-networking/            protocol guide and socket validation notes
  08-sync-engine/           engine ownership, commit boundaries and recovery
  09-messaging/             durable/ephemeral delivery and validation notes
  10-local-first/           offline divergence, local durability and evidence
  11-collaboration/         application contracts, product evidence and editor lab
  12-multiplayer/           game timelines, genre contracts and evidence
  13-local-concurrency/     shared-memory contracts, progress and evidence
  14-security/             trust, authorization, replay, encryption and audit
  15-production/           scaling, overload, recovery and correctness tests
  16-handbook/ ... 18-synthesis/  later chapters, created sequentially
examples/synchronization/
  00-foundations/           dependency-free executable experiments
  01-math-conflicts/        quantitative and merge experiments; 20 tests
  02-ot/                   bounded pairwise transforms; 10 tests
  03-crdts/                replicated types and semantic limits; 23 tests
  04-networking/           real TCP/UDP loopback and parser tests
  05-local-concurrency/     Java forced races/ABA and Node shared workers
  a-versioned-store/        Project A: conditional records, Java and PostgreSQL
  b-durable-chat/           Project B: WebSockets, PostgreSQL, catch-up
  c-offline-engine/         Project C: SQLite outbox, snapshots and crash tests
  d-collaborative-text/     Project D: Yjs CLI editor, durable server, undo/presence
  e-crdts/                 Project E: merge types and convergence tests
  f-multiplayer/           Project F: authoritative UDP slots, replay and faults
  g-fault-harness/         Project G: seeded adverse schedules and crash tests
```

Only written paths exist. Planned directories will be created with substantive content, rather than empty chapter shells. Existing repository templates remain the editorial reference.

## Completion standard

Each chapter must answer its declared questions, explain a mechanism with intermediate states, bound claims by assumptions, cover diagnosis and recovery, and cite primary evidence. Each project must run from documented setup and include meaningful tests. Chapters remain `draft` while material gaps exist, move to `review` when substantively complete, and become `ready` after a named technical review. No product architecture will be inferred from its user interface.
