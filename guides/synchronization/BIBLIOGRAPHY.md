# Primary-source bibliography and reading roadmap

Evidence checked 2026-10-13. This is the foundation bibliography, not yet the full course bibliography. Dates below are publication dates, not search-engine crawl dates. No claim of formal ASD-STE100 compliance is made; its controlled dictionary was not consulted.

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

## Research still required

Original OT literature and modern control algorithms; vector-clock originals; session and causal consistency papers; TCP/UDP/QUIC/WebSocket/SSE specifications; broker documentation; Java memory-model specification; Yjs/Automerge source and protocol documentation; Figma/Linear/Notion/Google responsible-team accounts; Slack/Discord delivery and storage accounts; Valve/Unity/Epic/GGPO game networking sources; local-first and encrypted synchronization research; failure testing and recovery literature.

These are research targets, not verified citations. Add exact titles, dates, versions, claim boundaries and links when the corresponding chapter is researched.
