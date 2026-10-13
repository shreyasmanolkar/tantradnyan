# Synchronization-engine evidence and validation

Research date: 2026-10-13. The responsibility map and reference protocol are authored design arguments, not undocumented product internals.

Primary sources read: W3C IndexedDB 3.0 transaction specification; SQLite transaction/atomic-commit documentation; PostgreSQL 18 LISTEN/NOTIFY and transaction isolation; existing OT/CRDT and database sources linked from earlier chapters; broker delivery documentation used in the messaging guide. RFC 9420 is the group-key protocol reference, not an implementation dependency.

Evidence boundaries: local transaction mechanics support coupling data/checkpoint/outbox within the selected store, not guaranteed browser storage retention or hardware durability. LISTEN's initialization race is specific documented primary evidence for register/inspect sequencing; Redis/Project B use their own catch-up mechanism. Scale, schema, filter, reset, region and encryption sections are explicit design consequences under stated models, not measured deployments.

Executable evidence: Project B, Node v26.7.0, PostgreSQL 18.4, Redis 7.4.3; packages pg 8.23.1, redis 6.3.0, ws 8.22.0, locked. Final run had 16 reported tests (two pure checks, thirteen integration scenarios and parent), all passing. Actual gateway SIGKILL before/after commit, separate gateways/broker, missing hints, revocation and 23-message pagination were exercised.

The first pagination test exposed text-alias ordering; qualifying the numeric input column fixed it. The client prefix guard rejected the invalid page. This is recorded implementation evidence, not an invented incident or claim about a vendor.

No durable client outbox, snapshot reset, pruning, encryption, migration or WAN fault test is claimed. Release review: see ../REVIEW.md; no formal ASD-STE100 compliance claim. Container lifecycle and image identities are recorded in the messaging research notes.

## Release review — 2026-10-14

Current status: ready for the stated educational scope. Reviewer: Codex (AI technical and editorial review); no independent human review claimed. Historical research/execution notes above retain their original scope and do not imply every cited full text was newly fetched. The [review record](../REVIEW.md) supersedes earlier pending-review/planned-work statements; [VALIDATION.json](../VALIDATION.json) records this release's actual reruns.

Open issues: none blocking this educational release. Scope limits and further validation: Lifecycle and atomic-boundary guide; distributed ownership, encryption, migrations and retention depend on the chosen deployment.
