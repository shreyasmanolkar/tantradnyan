# Production engineering evidence and validation

Status: ready (educational evidence record). Research/validation date: 2026-10-14. Reviewer: Codex (AI technical/editorial review), 2026-10-14.

## Primary sources read

- Google SRE [overload](https://sre.google/sre-book/handling-overload/), [cascading failures](https://sre.google/sre-book/addressing-cascading-failures/), [frontend load balancing](https://sre.google/sre-book/load-balancing-frontend/) and workbook [SLO alerting](https://sre.google/workbook/alerting-on-slos/): responsible-team engineering mechanisms. Original numerical capacity/latency budgets in this guide are illustrative assumptions, not measurements from Google or this lab.
- PostgreSQL 18 [standby servers](https://www.postgresql.org/docs/18/warm-standby.html), [logical decoding](https://www.postgresql.org/docs/18/logicaldecoding-explanation.html), [PITR](https://www.postgresql.org/docs/18/continuous-archiving.html): database recovery/replication behavior, distinct from application fencing/identity. No standby/PITR/CDC deployment was executed here.
- [FoundationDB SIGMOD 2021 paper](https://www.foundationdb.org/files/fdb-paper.pdf): original integrated deterministic simulation research. Initial foundationdb.github.io PDF URL failed; the project's official hosted PDF succeeded. Project G does not claim equivalent simulation coverage or FoundationDB integration.
- [OpenTelemetry observability primer](https://opentelemetry.io/docs/concepts/observability-primer/), current documentation checked by date: signal/context concepts, not an implemented telemetry exporter.
- [Jepsen linearizability model](https://jepsen.io/consistency/models/linearizable): primary testing/model exposition consulted; no Jepsen cluster run was performed.

Architecture, runbooks, rate/storage/memory/burn-rate calculations and test oracles are authored reference designs under stated assumptions. No proprietary application deployment or production benchmark is inferred.

## Project G executed evidence

Node 26.7.0, bundled SQLite 3.53.4, no dependencies/containers. Reuses Project C storage/protocol and prior dependency-free CRDT datatypes. Initial 24 tests passed; after deterministic capture/startup/watchdog hardening, the expanded suite reported 25 passes, zero failures.

Five seeds each ran twice with matching normalized traces/results, using file-backed authority/client stores. The logical adapter faults submissions/ACKs, restores reliable delivery, retries original IDs, actually prunes changes and reliably installs outcome-aware snapshots. It does not claim concurrent asynchronous push/pull simulation. Final oracle checks original deltas, one durable outcome/head increment per original operation, coherent version/head and equal client projection/checkpoint without double overlay.

Real HTTP proxy tests cover duplicate forwarding, lost response after upstream commit, request partition/heal and delayed captured response. SQLite TEMP trigger ABORT tests couple authority effect/outcome/log and client projection/queue/receipt/checkpoint rollback. They do not emulate disk-full, fsync corruption or power loss.

Actual owned child processes received SIGKILL at server before/after commit and client before/after install / after-response-before-receipt. Restart used surviving SQLite files. Startup failure was tested separately; watchdog termination is not accepted as an intended phase crash.

Default demo seed 7 observed operations=16, count=30, head=16; scheduled send=86, drop=11, duplicate=21, delivered=96. Sending counts include response attempts and are not original logical-operation counts. Same-seed replay and anchored journal validation both returned true. Journal is unsigned/in-memory; anchored truncation and event edit are tested, not malicious audit-administrator resistance.

Scope/permission cases include current revocation, changed payload, forged extra namespace field, schema refusal, tuple-key collision distinction and simulated rollback page. They do not establish full multitenant/JWT/TLS security or actual disaster restore.

## Review gaps

No full production load, regional partition, cluster owner transfer, replica promotion, broker outage, backup restore, encryption/key recovery, mixed-version deployment, OS packet emulator or exhaustive state-space exploration was executed. Tests use disposable owned loopback processes/stores; no unrelated service/process/network setting is changed. All temporary data is removed after completion.

Review should inspect ownership/fencing, commit/ACK ambiguity, snapshot/dedup retention, overload/admission semantics, model fidelity and oracle independence. Validate production-specific runbooks with rehearsals before ready. No formal ASD-STE100/compliance claim.

## Release review — 2026-10-14

Current status: ready for the stated educational scope. Reviewer: Codex (AI technical and editorial review); no independent human review claimed. Historical research/execution notes above retain their original scope and do not imply every cited full text was newly fetched. The [review record](../REVIEW.md) supersedes earlier pending-review/planned-work statements; [VALIDATION.json](../VALIDATION.json) records this release's actual reruns.

Open issues: none blocking this educational release. Scope limits and further validation: Production design and local fault harness; actual regional failover, migrations, secure admission, capacity and disaster restore require deployment rehearsals.
