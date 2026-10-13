# Synchronization, distributed state, and multiplayer systems

Status: **draft; first installment**. Evidence checked: 2026-10-13. This index distinguishes written material from planned material. The full masterclass is not yet complete.

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
| 2 | `02-mathematics/README.md`: quantitative reference; proofs, queueing, reliability, bounds and complexity | Planned |
| 3 | `03-conflict-resolution/README.md`: compare merge policies using identical histories and domain invariants | Planned |
| 4 | `04-ot/README.md`: transformations, correctness conditions, client/server state and structured text | Planned |
| 4 | `05-crdts/README.md`: semilattices, causal operations, concrete data types, deletion and compaction | Planned |
| 5 | `06-database-concurrency/README.md`: transactions, MVCC, CAS, WAL, replication, consensus and distributed commit | Planned |
| 5 | `07-networking/README.md`: transport, delivery, congestion, latency budgets, packet protocols and NAT | Planned |
| 6 | `08-sync-engine/README.md`: mutation lifecycle, durable queues, cursors, recovery, protocol evolution and ownership | Planned |
| 7 | `09-messaging/README.md`: durable chat, ephemeral events, brokers, ordering, fan-out and recovery | Planned |
| 7 | `10-local-first/README.md`: offline state, days-long divergence, migrations, permissions and encrypted synchronization | Planned |
| 7 | `11-collaboration/README.md`: text, design graphs, task systems, shared code and terminals | Planned |
| 7 | `12-multiplayer/README.md`: authoritative simulation, prediction, interpolation, rollback, fairness and game genres | Planned |
| 8 | `13-local-concurrency/README.md`: Java primitives, memory ordering, ABA, progress guarantees and distributed boundaries | Planned |
| 8 | `14-security/README.md`: trust boundaries, revocation, tenant isolation, replay, validation and audit | Planned |
| 9 | `15-production/README.md`: scaling, regional deployment, overload, observability, recovery and correctness testing | Planned |
| 9 | `16-handbook/README.md`: executable projects A–G, setup, tests, walkthroughs and hardening | Planned |
| 10 | `17-comparisons/README.md`: application architecture matrices with evidence labels | Planned |
| 10 | `18-synthesis/README.md`: derive a new architecture and read unfamiliar systems independently | Planned |
| Reference | [Notation](NOTATION.md), [glossary](GLOSSARY.md), [bibliography](BIBLIOGRAPHY.md), [dependency map](DEPENDENCIES.md) | Written; expands with chapters |
| Experiment | [Foundation lab](../../examples/synchronization/00-foundations/README.md): lost updates, retries, causal comparisons and noncommuting text edits | Runnable source and tests written; see validation record |

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
  02-mathematics/ ... 18-synthesis/  detailed chapters, created sequentially
examples/synchronization/
  00-foundations/           dependency-free executable experiments
  a-versioned-store/        Project A: conditional records, Java and PostgreSQL
  b-durable-chat/           Project B: WebSockets, PostgreSQL, catch-up
  c-offline-engine/         Project C: durable local outbox and replay
  d-collaborative-text/     Project D: document synchronization
  e-crdts/                 Project E: merge types and convergence tests
  f-multiplayer/           Project F: authoritative simulation and clients
  g-fault-harness/         Project G: seeded adverse schedules and crash tests
```

Only written paths exist. Planned directories will be created with substantive content, rather than empty chapter shells. Existing repository templates remain the editorial reference.

## Completion standard

Each chapter must answer its declared questions, explain a mechanism with intermediate states, bound claims by assumptions, cover diagnosis and recovery, and cite primary evidence. Each project must run from documented setup and include meaningful tests. Chapters remain `draft` while material gaps exist, move to `review` when substantively complete, and become `ready` after a named technical review. No product architecture will be inferred from its user interface.
