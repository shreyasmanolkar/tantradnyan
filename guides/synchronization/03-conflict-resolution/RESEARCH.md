# Conflict resolution evidence and review notes

Research date: 2026-10-13.

| Claim family | Evidence read | Boundary |
|---|---|---|
| CAS exposed as conditional HTTP mutation | RFC 9110 full text, §13.1.1 | Strong ETag precondition at origin; underlying atomic mutation still needed |
| Database conditional updates and transaction retry | PostgreSQL 18 transaction-isolation documentation | Version-bound behavior; SQL here was not run against a database |
| Causal vectors | Mattern 1989 original PDF | Complete protocol/membership assumptions; writers vs all events distinguished |
| CRDT constructions | Shapiro et al. RR-7506 January 2011 full PDF, §2.3 | Type-specific assumptions, not arbitrary operations over JSON |
| Observed-remove semantics | Bieniusa et al. 2012 original report PDF | Simple tagged/tombstone form in lab, not optimized ORSWOT |
| OT origin/context and pairwise obligation | Ellis/Gibbs 1989 original PDF, SIGMOD host | Historical motivation; does not endorse original algorithm as complete modern editor |
| Base and conflict representation | Official Git merge documentation, accessed 2026-10-13 | Line-oriented Git behavior illustrates review; lab is flat-record merge |
| Invariant-dependent coordination | Bailis et al. 2014 original paper | Independent operation/invariant analysis, not blanket coordination |

The max-selection algebra, scalar three-way table, schedule counterexample, delete/recreate history and lab representations are explicitly constructed here. Version/CAS enforcement follows the atomic boundary described in the foundation; no distributed CAS implementation is claimed.

Review focus: check that missing/null are distinct; conflicts are not committed as complete partial merges; old candidates cannot reappear after dominance; concurrent unseen add survives observed removal; removal-before-add replay is safe; permission checks are not inferred from data convergence; timestamp tie-breaking cannot depend on locale.

Validation: 2026-10-13, Node.js v26.7.0: demo output matched all eight documented lines; direct execution of `model.test.mjs` reported 20 passing tests, zero failures. Checks cover finite fixtures and deterministic schedules, not disk/network guarantees. SQL and full OT implementations are not executed in this installment. Release review: see ../REVIEW.md; no formal ASD-STE100 compliance claim.

## Release review — 2026-10-14

Current status: ready for the stated educational scope. Reviewer: Codex (AI technical and editorial review); no independent human review claimed. Historical research/execution notes above retain their original scope and do not imply every cited full text was newly fetched. The [review record](../REVIEW.md) supersedes earlier pending-review/planned-work statements; [VALIDATION.json](../VALIDATION.json) records this release's actual reruns.

Open issues: none blocking this educational release. Scope limits and further validation: Domain policies and finite fixtures; production causal compaction and policy enforcement require implementation-specific verification.
