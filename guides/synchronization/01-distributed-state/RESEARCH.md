# Foundation evidence and review notes

Research date: 2026-10-13. Abstract examples are authored for this guide; they are not empirical measurements or production experience.

| Claim family | Primary evidence | Boundary |
|---|---|---|
| Causal order and logical clocks | Lamport 1978, author-hosted publication page | Scalar clock implication is one-way; no claim that arbitrary timestamps detect concurrency |
| Linearizability | Herlihy/Wing 1990 original paper opened | Operation intervals and real-time order; not automatically multi-object transaction atomicity |
| Sequential consistency | Lamport 1979 author-hosted page | Original formulation; no modern CPU implementation claim |
| CAP | Gilbert/Lynch 2002 paper located | Full-text open returned an error; proof exposition needs another source-access pass |
| PACELC | Abadi 2012 full text opened | Design framework; avoid treating every implementation as one fixed global category |
| Quorums | Dynamo 2007 responsible-team report | Historical system; overlap proof in this guide is elementary set reasoning |
| Consensus/logs | Raft 2014 extended paper opened | Determinism, commit rules, majority and term assumptions matter |
| Invariant confluence | Bailis et al. 2014 full text opened | State/operation/invariant-dependent result; not blanket coordination avoidance |
| CRDT/SEC overview | Shapiro et al. 2011 paper located | Full-text open error; detailed models postponed to CRDT guide |
| Snapshot isolation/write skew | PostgreSQL 18 documentation opened | Version-bound implementation and transaction retry advice |

Worked seat, document, replay and cursor histories are illustrative constructions. They demonstrate consequences of their stated rules, not evidence that a vendor implements those rules.

Validation: 2026-10-13, Node.js v26.7.0; demo output matched documentation. Direct execution of the test module reported six passing tests, zero failures. The `--test` invocation also passed but reported at file level in this environment. The lab uses memory and does not establish network, disk or multi-process crash guarantees. Planned A–G integration tests must cover those boundaries.

Editorial review: reader and boundary defined; each foundation question has a causal example; examples state assumptions; citations placed near established properties; limitations and operational/security boundaries explicit. Remaining gaps are listed in the chapter. Formal ASD-STE100 compliance is not asserted.
