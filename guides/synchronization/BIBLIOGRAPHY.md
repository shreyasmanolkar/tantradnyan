# Primary-source bibliography and reading roadmap

Evidence checked 2026-10-13. This covers installments 1–4, not yet the full course bibliography. Dates below are publication dates, not search-engine crawl dates. No claim of formal ASD-STE100 compliance is made; its controlled dictionary was not consulted.

## Ordering and concurrent observations

1. Leslie Lamport, [Time, Clocks, and the Ordering of Events in a Distributed System](https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/) (1978). Read for causal order and why a total order adds choices beyond causality. Author-hosted page and linked original paper.
2. Leslie Lamport, [How to Make a Multiprocessor Computer That Correctly Executes Multiprocess Programs](https://www.microsoft.com/en-us/research/publication/make-multiprocessor-computer-correctly-executes-multiprocess-programs/?lang=ko-kr) (1979). Original sequential-consistency formulation; useful for separating program order from real-time order.
3. Maurice Herlihy and Jeannette Wing, [Linearizability: A Correctness Condition for Concurrent Objects](https://www.cs.cmu.edu/~wing/publications/HerlihyWing90.pdf) (1990; preliminary work 1987). Read definitions and histories before implementation proofs. Explains an operation's apparent atomic effect.

## Availability, replication and coordination

4. Seth Gilbert and Nancy Lynch, [Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services](https://www.cs.princeton.edu/courses/archive/spr22/cos418/papers/cap.pdf) (2002). Formal model behind CAP. Search located original-paper text; full-text open failed during this installment. Recheck before detailed proof review.
5. Daniel Abadi, [Consistency Tradeoffs in Modern Distributed Database System Design](https://www.cs.umd.edu/~abadi/papers/abadi-pacelc.pdf) (2012). PACELC makes ordinary-operation latency a separate design question from partition behavior.
6. Diego Ongaro and John Ousterhout, [In Search of an Understandable Consensus Algorithm, extended version](https://raft.github.io/raft.pdf) (2014). Leader election, replicated logs, commitment, recovery and safety. Start with the replicated-state-machine model; read restrictions before implementing a leader protocol.
7. Giuseppe DeCandia et al., [Dynamo: Amazon's Highly Available Key-value Store](https://www.amazon.science/publications/dynamo-amazons-highly-available-key-value-store) (2007); [responsible-team discussion](https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html). Historical evidence for partitioning, versioning and reconciliation. Dynamo is not interchangeable with the current DynamoDB service.
8. Peter Bailis et al., [Coordination Avoidance in Database Systems](https://www.vldb.org/pvldb/vol8/p185-bailis.pdf) (2014). Invariant confluence explains why particular operations and constraints need coordination; avoids a blanket rule that every write needs consensus.

## Convergent data and database isolation

9. Marc Shapiro et al., [Conflict-free Replicated Data Types](https://perso.lip6.fr/Marc.Shapiro/papers/2011/CRDTs_SSS-2011.pdf) (2011). Formal convergence models and sufficient conditions. Search located paper text; full-text open failed here. Later CRDT guide needs the full report and algorithm-specific sources.
10. PostgreSQL, [Transaction Isolation, version 18](https://www.postgresql.org/docs/18/transaction-iso.html) (versioned documentation, accessed 2026-10-13). Read for actual snapshot/read-committed behavior, serialization failures and transaction retry requirements. General SQL labels do not fully specify a database's implementation.

## Quantitative models, causal histories and conflict mechanisms

11. John D. C. Little, [A Proof for the Queuing Formula: L = λW](https://pubsonline.informs.org/doi/abs/10.1287/opre.9.3.383) (1961), and the author's [Little’s Law as Viewed on Its 50th Anniversary](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf) (2011). Read the original assumptions, then the accounting/sample-path interpretation. Original publisher abstract and retrospective full text were accessible; the alternate 1961 PDF fetch failed.
12. MIT 1.041, [Queueing-model lecture](https://web.mit.edu/1.041/www/lectures/L8-queuing-models-2026sp.pdf) (spring 2026). University teaching source for queueing assumptions and standard single-server models. Model inputs must be checked against the actual workload.
13. IETF, [RFC 7323: TCP Extensions for High Performance](https://datatracker.ietf.org/doc/html/rfc7323) (September 2014), especially §1.1. Read why feedback/window size constrains large bandwidth-delay paths. Full text retrieved through the IETF host after RFC Editor rate limiting.
14. IETF, [RFC 5905: Network Time Protocol Version 4](https://www.rfc-editor.org/rfc/rfc5905.html) (June 2010), especially §8. Read four-timestamp offset/delay estimation before interpreting physical timestamps. Historical protocol specification; this installment does not prescribe a current NTP deployment.
15. Friedemann Mattern, [Virtual Time and Global States of Distributed Systems](https://pages.cs.wisc.edu/~remzi/Classes/739/Fall2018/Papers/mattern89.pdf) (1989). Original paper on vector time and causal knowledge. Read with the explicit event-vector construction, rather than treating arbitrary arrays as causal metadata.
16. Marc Shapiro et al., [A Comprehensive Study of Convergent and Commutative Replicated Data Types, RR-7506](https://www.lip6.fr/Marc.Shapiro/papers/2011/Comprehensive-CRDTs-RR7506-2011-01.pdf) (January 2011). Full report retrieved successfully; §2.3 develops sufficient convergence conditions. Complements the previously located SSS paper whose full-text access failed; it does not imply that earlier PDF was retrieved.
17. Annette Bieniusa et al., [An Optimized Conflict-free Replicated Set](https://arxiv.org/abs/1210.3368) (October 2012; original PDF retrieved). Read for the concurrency meaning of observed removal and how compact metadata differs from naive tombstones. The lab uses the simpler retained-evidence form.
18. Clarence A. Ellis and Simon J. Gibbs, [Concurrency Control in Groupware Systems](https://sigmodrecord.org/?download_id=10728&smd_process_download=1) (1989). Original OT motivation and transformation-based group editing. A historical starting point, not a sufficient modern implementation recipe.
19. IETF, [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.txt) (June 2022), §13.1.1. Specifies `If-Match` and strong validators. The server still needs atomic application enforcement behind this interface.
20. Git project, [git-merge documentation](https://git-scm.com/docs/git-merge) (accessed 2026-10-13). Explains conflict presentation and ancestor display. No claim that a textual clean merge establishes domain correctness.
21. Philip A. Bernstein, Vassos Hadzilacos and Nathan Goodman, [Concurrency Control and Recovery in Database Systems](https://www.microsoft.com/en-us/research/people/philbe/book/) (1987). Author-hosted access page located. Recommended longer reading on transaction schedules and recovery; detailed book sections have not yet been read for this course.

## OT control, CRDT verification and rich text

22. Aurel Randolph, Hanifa Boucheneb, Abdessamad Imine and Alejandro Quintero, [On Consistency of Operational Transformation Approach](https://arxiv.org/pdf/1302.3292) (EPTCS 107, 2013). Read TP1/TP2 limitations with the paper's simple signatures and permitted histories; avoid extrapolating its scope to every OT protocol.
23. Hengfeng Wei, Yu Huang and Jian Lu, [Specification and Implementation of Replicated List: The Jupiter Protocol Revisited](https://arxiv.org/pdf/1708.04754) (OPODIS 2018; extended version retrieved). Read client/server state-space reasoning and the distinction between a transform function and a protocol proof. Original Jupiter 1995 paper remains a reading target; its located mirror fetch failed.
24. Victor B. F. Gomes, Martin Kleppmann, Dominic P. Mulligan and Alastair R. Beresford, [Verifying Strong Eventual Consistency in Distributed Systems](https://martin.kleppmann.com/papers/crdt-isabelle-oopsla17.pdf) (OOPSLA 2017). Original network/identity model and machine-checked CRDT results. Useful for learning why a datatype proof must include its delivery assumptions.
25. Paulo Sérgio Almeida, Ali Shoker and Carlos Baquero, [Delta State Replicated Data Types](https://arxiv.org/pdf/1603.01529) (preprint March 2016; journal version 2018). Read joinable fragments, dotted contexts and causal delta-merging conditions before inventing an incremental patch protocol.
26. Martin Kleppmann and Alastair R. Beresford, [A Conflict-Free Replicated JSON Datatype](https://arxiv.org/pdf/1608.03960) (2016 preprint). Formal structured state semantics; maps, nested objects, lists and deletion require more than generic field merging.
27. Martin Kleppmann et al., [Interleaving Anomalies in Collaborative Text Editors](https://martin.kleppmann.com/papers/interleaving-papoc19.pdf) (PaPoC 2019), followed by Matthew Weidner and Martin Kleppmann, [The Art of the Fugue](https://arxiv.org/pdf/2305.00583) (2023 preprint). Compare convergence with stronger ordering/intent criteria for concurrent text.
28. Geoffrey Litt, Sarah Lim, Martin Kleppmann and Peter van Hardenberg, [Peritext: A CRDT for Collaborative Rich Text Editing](https://groups.csail.mit.edu/sdg/pubs/2022/Peritext_PACM_HCI_2022.pdf) (CSCW 2022). Read explicit formatting scenarios and stable text-identity spans; convergent per-character marks do not establish this intent model.
29. Unicode Consortium, [UAX #29 revision 49: Unicode Text Segmentation](https://unicode.org/reports/tr29/tr29-49.html) (Unicode 18.0.0, dated 2026-09-01, consulted 2026-10-13). Precise grapheme segmentation reference; this is not a claim about a JavaScript runtime's Unicode data version.
30. Yjs, [document updates](https://docs.yjs.dev/api/document-updates), [relative positions](https://docs.yjs.dev/api/relative-positions), [Y.Doc](https://docs.yjs.dev/api/y.doc), and [awareness](https://docs.yjs.dev/getting-started/adding-awareness) (official documentation accessed 2026-10-13). Read update algebra, cursor anchoring, session identity/GC and ephemeral presence as separate contracts. No dependency version is installed in this installment.
31. Automerge, [conflicts](https://automerge.org/docs/reference/documents/conflicts/), [counters](https://automerge.org/docs/reference/documents/counters/), [rich text](https://automerge.org/docs/reference/documents/rich-text/), [concepts](https://automerge.org/docs/reference/concepts/), and [Rust sync API](https://docs.rs/automerge/latest/automerge/sync/index.html) (official documentation accessed 2026-10-13). Read datatype, repository and peer-protocol contracts separately. The documented reliable stream requirement is stronger than a bare claim of CRDT convergence.

## Database authority and recovery

32. PostgreSQL 18: [MVCC introduction](https://www.postgresql.org/docs/18/mvcc-intro.html), [explicit locks](https://www.postgresql.org/docs/18/explicit-locking.html), [constraints](https://www.postgresql.org/docs/18/ddl-constraints.html), [serialization failure handling](https://www.postgresql.org/docs/18/mvcc-serialization-failure-handling.html), and [vacuum](https://www.postgresql.org/docs/18/routine-vacuuming.html) (accessed 2026-10-13). Read the actual isolation/locking contracts rather than assuming SQL level names behave identically in every database. Complements the previously listed isolation page.
33. PostgreSQL 18: [WAL introduction](https://www.postgresql.org/docs/18/wal-intro.html), [WAL configuration](https://www.postgresql.org/docs/18/runtime-config-wal.html), [standby replication](https://www.postgresql.org/docs/18/warm-standby.html), [logical decoding](https://www.postgresql.org/docs/18/logicaldecoding-explanation.html), [logical replication conflicts](https://www.postgresql.org/docs/18/logical-replication-conflicts.html), and [PREPARE TRANSACTION](https://www.postgresql.org/docs/18/sql-prepare-transaction.html). Read durability, replay/retention, subscriber conflicts and coordinator obligations as separate mechanisms.
34. Dan R. K. Ports and Kevin Grittner, [Serializable Snapshot Isolation in PostgreSQL](https://arxiv.org/pdf/1208.4179) (2012). Original engineering account of serializable dependency handling, complementing the current versioned documentation. Its historical implementation details are not automatically current product facts.
35. Oracle Java SE 25: [AtomicReference](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html) and [AtomicInteger](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html). Read comparison and memory-effect contracts; these primitives are local, not database/durable distributed decisions.

## Network services and protocol specifications

36. IETF [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293.html) (August 2022), [RFC 768: UDP](https://www.rfc-editor.org/rfc/rfc768.html) (August 1980), and [RFC 8200: IPv6](https://www.rfc-editor.org/rfc/rfc8200.html) (July 2017). Read boundaries between packets, datagrams and ordered bytes before designing application framing.
37. IETF [RFC 5681: TCP Congestion Control](https://www.rfc-editor.org/rfc/rfc5681.html) (September 2009), [RFC 6298: Computing TCP's Retransmission Timer](https://www.rfc-editor.org/rfc/rfc6298.html) (June 2011), [RFC 8085: UDP Usage Guidelines](https://www.rfc-editor.org/rfc/rfc8085.html) (March 2017), and [RFC 8899: Datagram PLPMTUD](https://www.rfc-editor.org/rfc/rfc8899.html) (September 2020). Read why reliable custom UDP must also handle congestion, timing and packet size. No claim that every current stack uses one historical congestion algorithm.
38. IETF [RFC 6455: WebSocket](https://www.rfc-editor.org/rfc/rfc6455.html) (December 2011), [RFC 8441: WebSockets over HTTP/2](https://www.rfc-editor.org/rfc/rfc8441.html) (September 2018), and [RFC 9220: WebSockets over HTTP/3](https://www.rfc-editor.org/rfc/rfc9220.html) (June 2022). Read message/control framing and establishment variants; none supplies durable replay of missed operations.
39. WHATWG [SSE in HTML](https://html.spec.whatwg.org/multipage/server-sent-events.html) and [WebSockets Standard](https://websockets.spec.whatwg.org/) (living specification snapshots accessed 2026-10-13). Read browser event IDs, reconnect and buffered-output semantics; application checkpoint and retention boundaries still need definition.
40. IETF [RFC 9000: QUIC](https://www.rfc-editor.org/rfc/rfc9000.html) (May 2021), and [RFC 9221: QUIC Datagrams](https://www.rfc-editor.org/rfc/rfc9221.html) (March 2022). Reliable stream and unreliable datagram semantics are distinct facilities within a secure transport.
41. IETF [RFC 8446: TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446.html) (August 2018). Read authentication/channel guarantees and early-data replay limitations before accepting replay-sensitive actions.
42. IETF [RFC 8489: STUN](https://www.rfc-editor.org/rfc/rfc8489.html) (February 2020), [RFC 8445: ICE](https://www.rfc-editor.org/rfc/rfc8445.html) (July 2018), and [RFC 8656: TURN](https://www.rfc-editor.org/rfc/rfc8656.html) (February 2020). Read address discovery, candidate checks and relay obligations separately; public address discovery is not guaranteed connectivity.
43. Node.js official [net API](https://nodejs.org/docs/latest/api/net.html) and [dgram API](https://nodejs.org/api/dgram.html) (accessed 2026-10-13). Socket buffering, error and closure behavior for the labs. Host validation used Node v26.7.0, independently of the newest version displayed on these documentation pages.

## Research still required

Original Jupiter 1995 and selected complete OT implementation/control proof; Fidge vector-clock original (located but full-text fetch failed); session and causal consistency papers; Broker and durable WebSocket application documentation; full Java memory-model specification; Pinned Yjs/Automerge implementations, persistence/provider integration and protocol source; Figma/Linear/Notion/Google responsible-team accounts; Slack/Discord delivery and storage accounts; Valve/Unity/Epic/GGPO game networking sources; local-first and encrypted synchronization research; failure testing and recovery literature.

These are research targets, not verified citations. Add exact titles, dates, versions, claim boundaries and links when the corresponding chapter is researched.

## Synchronization engines and messaging: installment 5

Checked 2026-10-13; implementation versions and executed boundaries are recorded in chapter research notes.

- [IndexedDB specification](https://www.w3.org/TR/IndexedDB/) and [SQLite atomic commit](https://www.sqlite.org/atomiccommit.html): local transaction lifecycle and crash-boundary reasoning; neither promises indefinite browser retention.
- [PostgreSQL 18 LISTEN](https://www.postgresql.org/docs/18/sql-listen.html), [NOTIFY](https://www.postgresql.org/docs/18/sql-notify.html) and [ORDER BY](https://www.postgresql.org/docs/18/queries-order.html): live/history initialization and transaction behavior; output aliases explain a reproduced pagination defect.
- [node-postgres transactions](https://node-postgres.com/features/transactions) and [queries](https://node-postgres.com/features/queries): checked-out connection scope and parameterized values; identifiers need separate validation.
- [Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/): transient at-most-once subscriber delivery; read before making broadcasts authoritative.
- [RabbitMQ confirms/acknowledgments](https://www.rabbitmq.com/docs/confirms), documentation version 4.3: names the distinct publisher and consumer proof boundaries.
- [Kafka 4.1 design](https://kafka.apache.org/41/design/design/): partition order and explicitly scoped processing guarantees; external effects need cooperation.
- [ws 8.22.0 source README](https://github.com/websockets/ws/blob/8.22.0/README.md) and [node-redis source](https://github.com/redis/node-redis): actual transport/broker client APIs used in Project B.
- [CQRS](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs) and [event sourcing](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing): useful pattern boundaries, not requirements for chat.
- [RFC 9420: MLS](https://www.rfc-editor.org/rfc/rfc9420.html), July 2023: group-key protocol; distinguish key security from application state and authorization semantics.

## Local-first software and offline durability: installment 6

Checked 2026-10-13. Separate user aspirations, storage guarantees and protocol choices.

- [Kleppmann et al., Local-first software](https://www.inkandswitch.com/essay/local-first/), 2019: responsiveness, ownership and collaborative/offline goals; a research agenda rather than a complete production protocol.
- [Node 26.7.0 SQLite API](https://nodejs.org/download/release/v26.7.0/docs/api/sqlite.html): versioned DatabaseSync API used in Project C, avoiding assumptions from newer unversioned documentation.
- [SQLite transaction semantics](https://www.sqlite.org/lang_transaction.html), [WAL](https://www.sqlite.org/wal.html), [synchronous setting](https://www.sqlite.org/pragma.html#pragma_synchronous) and [online backup](https://www.sqlite.org/backup.html): local atomicity, storage assumptions and coherent backup.
- [WHATWG Storage](https://storage.spec.whatwg.org/) and [IndexedDB 3.0](https://www.w3.org/TR/IndexedDB/): browser persistence, quotas and transaction lifecycle; persistent origin storage is not an off-device backup.
- [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), January 2025: current OAuth security practice; Project C uses public fixture tokens and implements no real refresh flow.

Read the local-first guide's [validation record](10-local-first/RESEARCH.md) alongside these sources to distinguish actual process-crash evidence from untested browser, media, migration and cryptographic behavior.

## Collaborative application models and library integration: installment 7

Checked 2026-10-13. Historical reports establish the described design at their publication date, not current complete internals.

- [Figma multiplayer, Evan Wallace](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/), 2019-10-16: property/object/tree decisions and the distinction between document synchronization and other application data.
- [Notion data model, Jake Teton-Landis](https://www.notion.com/blog/data-model-behind-notion), 2021-05-18: blocks, rendering/permission links and grouped queued work.
- [Linear sync-engine talk landing page](https://linear.app/now/scaling-the-linear-sync-engine), 2023-06-29: a further-viewing lead; its talk was not reviewed and no detailed algorithm is inferred from the landing page.
- [Yjs updates](https://docs.yjs.dev/api/document-updates), [Y.Text](https://docs.yjs.dev/api/shared-types/y.text), [relative positions](https://docs.yjs.dev/api/relative-positions), [UndoManager](https://docs.yjs.dev/api/undo-manager), [Awareness](https://docs.yjs.dev/api/about-awareness): editor/provider API boundaries.
- [Yjs 13.6.33 encoding source](https://github.com/yjs/yjs/blob/v13.6.33/src/utils/encoding.js): tagged implementation evidence for pending-structure/deletion encoding, checked alongside executable restart tests.
- [Microsoft Live Share security](https://learn.microsoft.com/en-us/visualstudio/liveshare/reference/security), page reports last update 2022-11-21: code, debugging and terminal access have distinct consequences.

Google's located 2010 official OT/protocol pages failed full-text fetch; their search excerpts do not establish present product behavior. See the [collaboration research record](11-collaboration/RESEARCH.md) for missing evidence and validated scope.

## Multiplayer time, replication and transport: installment 8

Checked 2026-10-14. Distinguish first-person examples and inspected source from universal game settings.

- [Glenn Fiedler, Fix Your Timestep!](https://www.gafferongames.com/post/fix_your_timestep/), June 2004: fixed-step accumulation and catch-up overload.
- [Snapshot Interpolation](https://www.gafferongames.com/post/snapshot_interpolation/), 2014-11-30, and [Snapshot Compression](https://www.gafferongames.com/post/snapshot_compression/): presentation buffering, approximation and explicit encoding/baseline choices.
- [GGPO](https://www.ggpo.net/) and [save/load/frame callback source](https://github.com/pond3r/ggpo/blob/master/src/include/ggponet.h): rollback architecture and complete-state integration obligations; not installed in Project F.
- [Valve Source SDK lag-compensation source](https://github.com/ValveSoftware/source-sdk-2013/blob/master/src/game/server/player_lagcompensation.cpp): concrete bounded timing/history checks, inspected by date; not a claim about all present Valve products.
- [RFC 8085](https://www.rfc-editor.org/rfc/rfc8085.html), March 2017: Internet UDP responsibilities.
- [RFC 8445](https://www.rfc-editor.org/rfc/rfc8445.html), July 2018, and [RFC 8656](https://www.rfc-editor.org/rfc/rfc8656.html), February 2020: ICE connectivity and TURN relay roles.
- [RFC 9221](https://www.rfc-editor.org/rfc/rfc9221.html), March 2022: QUIC unreliable datagrams within its transport context.

The Valve networking wiki and Fiedler lockstep page were unavailable during this research. [Multiplayer evidence notes](12-multiplayer/RESEARCH.md) record that limit, logical versus real-socket faults and untested production mechanisms.

## Local concurrency, memory and progress: installment 9

Checked 2026-10-14; Java specification/API scope SE 25, runtime validation OpenJDK 25.0.1.

- [JLS chapter 17](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html): memory model, synchronization, final construction and per-access distinctions.
- [AtomicReference](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicReference.html), [AtomicInteger](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html), [AtomicStampedReference](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/atomic/AtomicStampedReference.html) and [VarHandle](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/invoke/VarHandle.html): exact identity, purity, pair capture and memory modes.
- [ReentrantLock](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html), [Condition](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/Condition.html), [Semaphore](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/Semaphore.html) and [read/write lock](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/ReentrantReadWriteLock.html): ownership, cancellation, predicates and admission contracts.
- [Herlihy and Wing, linearizability](https://www.cs.columbia.edu/~wing/publications/HerlihyWing90.pdf), July 1990, and [Herlihy, wait-free synchronization](https://cs.brown.edu/people/mph/Herlihy91/p124-herlihy.pdf), January 1991: original correctness and progress literature.
- [ECMAScript Atomics](https://tc39.es/ecma262/multipage/structured-data.html#sec-atomics-object) and [Node 26.7.0 workers](https://nodejs.org/download/release/v26.7.0/docs/api/worker_threads.html): JS shared memory and agent boundaries.
- [jcstress](https://github.com/openjdk/jcstress): specialized concurrency investigation, researched but not executed here.
- [Marçais/Kingsford Jellyfish paper](https://dna.cs.byu.edu/bio465/papers/fastparallel.pdf), 2011, and [authors' historical page](https://www.cs.cmu.edu/~ckingsf/software/jellyfish/): a concrete CAS-based k-mer workload; not a synchronization protocol or current release recommendation.

Read [validation notes](13-local-concurrency/RESEARCH.md) to distinguish forced interleavings, finite stress, specification guarantees and missing cross-architecture/exhaustive evidence.

## Security, production and failure testing: installment 10

Checked 2026-10-14. Read security boundaries before selecting mechanisms; read the failure model before interpreting test coverage.

- [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), January 2025, and [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html), February 2020: OAuth and JWT security guidance; neither supplies an application object ACL.
- [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html), August 2018, and [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html), December 2011: TLS and WebSocket transport/origin boundaries.
- [RFC 9420](https://www.rfc-editor.org/rfc/rfc9420.html), July 2023: MLS group cryptographic membership; distinct from document merge and offline authorization.
- [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162.html), December 2021: Certificate Transparency authenticated tree/log mechanisms; Project G's unsigned hash chain is a smaller educational construction.
- PostgreSQL 18 [row security](https://www.postgresql.org/docs/18/ddl-rowsecurity.html), [standbys](https://www.postgresql.org/docs/18/warm-standby.html), [logical decoding](https://www.postgresql.org/docs/18/logicaldecoding-explanation.html) and [PITR](https://www.postgresql.org/docs/18/continuous-archiving.html): policy exceptions, replication boundaries, CDC and actual backup recovery requirements.
- Google SRE book (2016): [overload](https://sre.google/sre-book/handling-overload/), [cascading failures](https://sre.google/sre-book/addressing-cascading-failures/) and [frontend balancing](https://sre.google/sre-book/load-balancing-frontend/); workbook (2018): [SLO alerting](https://sre.google/workbook/alerting-on-slos/). Useful causal explanations for admission, retries and error-budget signals.
- [FoundationDB SIGMOD paper](https://www.foundationdb.org/files/fdb-paper.pdf), 2021: deterministic simulation integrated into a real distributed database; Project G does not recreate its process/storage/network model.
- [OpenTelemetry primer](https://opentelemetry.io/docs/concepts/observability-primer/): signals and distributed context; application identities and invariant checks still need explicit design.
- [Jepsen linearizability model](https://jepsen.io/consistency/models/linearizable): concise history contract for appropriate objects; no Jepsen cluster run is claimed here.

See [security evidence](14-security/RESEARCH.md), [production evidence](15-production/RESEARCH.md) and [Project G](../../examples/synchronization/g-fault-harness/README.md) for exact local validation and remaining review gaps.

## Consolidation reading route: installment 11

Checked 2026-10-14. The [handbook](16-handbook/README.md) links code and exact project validation scope; the [comparison evidence](17-comparisons/RESEARCH.md) distinguishes reference designs from dated product reports; the [synthesis](18-synthesis/README.md) provides a method for reading new systems.

Revisited primary sources: [PostgreSQL 18 isolation](https://www.postgresql.org/docs/18/transaction-iso.html) for domain transaction decisions, [Yjs updates](https://docs.yjs.dev/api/document-updates) for library/provider boundaries, [Figma's 2019 report](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) for explicitly historical field-level synchronization, [RFC 8085](https://www.rfc-editor.org/rfc/rfc8085.html) for Internet UDP obligations and [FoundationDB's 2021 paper](https://www.foundationdb.org/files/fdb-paper.pdf) for simulation scope. The original CRDT-paper HAL fetch was denied this turn and is not represented as a newly reviewed proof.

Efficient further study: reproduce one causal/conflict history, read its original proof/model, inspect a library implementation, trace durable recovery, then compare a dated engineering report. Record each source's assumptions, version/date, decision boundary and missing evidence before transferring its claims to a new application.
