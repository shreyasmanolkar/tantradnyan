---
status: ready
source_type: Evidence record
last_reviewed: 2026-10-14
reviewer: "Codex (AI technical/editorial review)"
review_date: 2026-10-14
release_scope: "Educational comparison evidence; no measured capacity or inferred current proprietary mechanisms"
---

# Comparison evidence

The three aligned category tables are authored reference designs. Every requested attribute is covered: state, authority, consistency/invariants, conflicts, transport, offline use, latency, persistence, failures, security and trade-offs. Eleven category rows recur in the same order. No latency benchmarks or current proprietary choices are inferred.

The Figma author report was reread at its official URL: [2019 report](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/). Its date remains historical despite current page availability. The comparison distinguishes its author's CRDT terminology from the general deployment possibility of CRDTs through a central server. A document-property policy is not generalized to text/graph invariants.

Also checked: [Yjs update API](https://docs.yjs.dev/api/document-updates), [PostgreSQL 18 isolation](https://www.postgresql.org/docs/18/transaction-iso.html), [RFC 8085](https://www.rfc-editor.org/rfc/rfc8085.html), and [FoundationDB 2021 paper](https://www.foundationdb.org/files/fdb-paper.pdf). Their narrow claims are cited next to the matching table discussion or evidence row. Existing product-evidence limits remain in chapter 11 research notes.

The attempted original CRDT paper fetch at `https://inria.hal.science/inria-00555588/document` returned an access-denied HTML page this turn; it was not treated as a newly read proof. Mechanism derivations and earlier primary-source records remain in the CRDT chapter. No invented citation, quotation, current version claim or proprietary assertion fills this gap.

Review gaps: evidence for current private product internals, independent evaluation of policy choices and integrated end-to-end application testing. The worked workspace combines mechanisms conceptually; linked tests remain separate programs. No formal ASD-STE100 compliance claim.

## Release review — 2026-10-14

Current status: ready for the stated educational scope. Reviewer: Codex (AI technical and editorial review); no independent human review claimed. Historical research/execution notes above retain their original scope and do not imply every cited full text was newly fetched. The [review record](../REVIEW.md) supersedes earlier pending-review/planned-work statements; [VALIDATION.json](../VALIDATION.json) records this release's actual reruns.

Open issues: none blocking this educational release. Scope limits and further validation: Authored reference designs with historical implementation evidence; no measured capacity or inferred current proprietary mechanism.
