# Primary-source bibliography and reading roadmap

Evidence checked 2026-10-13. This covers installments 1–2, not yet the full course bibliography. Dates below are publication dates, not search-engine crawl dates. No claim of formal ASD-STE100 compliance is made; its controlled dictionary was not consulted.

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

## Research still required

Modern OT control algorithms and correctness proofs; Fidge vector-clock original (located but full-text fetch failed); session and causal consistency papers; TCP/UDP/QUIC/WebSocket/SSE specifications; broker documentation; Java memory-model specification; Yjs/Automerge source and protocol documentation; Figma/Linear/Notion/Google responsible-team accounts; Slack/Discord delivery and storage accounts; Valve/Unity/Epic/GGPO game networking sources; local-first and encrypted synchronization research; failure testing and recovery literature.

These are research targets, not verified citations. Add exact titles, dates, versions, claim boundaries and links when the corresponding chapter is researched.
