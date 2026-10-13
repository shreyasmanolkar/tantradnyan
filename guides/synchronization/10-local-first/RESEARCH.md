# Local-first evidence, implementation and review record

Status: draft. Research/validation date: 2026-10-13. Reviewer: pending.

## Scope and claim classification

The architecture, task policies, state tables, calculations and retention arguments are authored reference designs. They are not claims about Notion, Linear, Google Docs or a particular local-first database. The 2019 local-first paper establishes a research agenda; this server-authoritative lab implements a subset of local persistence and reconciliation, not every aspiration in that agenda.

## Primary sources read

- [Kleppmann et al., Local-first software, 2019](https://www.inkandswitch.com/essay/local-first/): motivation and ownership/collaboration goals. Not a synchronization protocol specification.
- [Node 26.7.0 SQLite documentation](https://nodejs.org/download/release/v26.7.0/docs/api/sqlite.html): DatabaseSync API and synchronous execution, release-candidate status. The unversioned page had advanced to Node 26.11.1 and a renamed class; versioned documentation and actual exports were used for this lab.
- [SQLite transactions](https://www.sqlite.org/lang_transaction.html), [WAL](https://www.sqlite.org/wal.html), [PRAGMA synchronous](https://www.sqlite.org/pragma.html#pragma_synchronous) and [online backup](https://www.sqlite.org/backup.html): local transaction/storage boundaries. Process-kill measurements do not independently prove power-loss or hardware behavior.
- [IndexedDB 3.0](https://www.w3.org/TR/IndexedDB/): transaction activity/completion and local store mechanisms. No browser integration was executed.
- [WHATWG Storage](https://storage.spec.whatwg.org/): persistence and quotas; accessed 2026-10-13, page reports update 2026-10-06. The W3C storage URL could not be fetched; the living primary specification was read instead. No browser retention measurements are claimed.
- [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), January 2025: OAuth security context, not implemented refresh behavior.
- [RFC 9420](https://www.rfc-editor.org/rfc/rfc9420.html), July 2023: MLS group-key security boundaries, not an encrypted synchronization implementation.

Prior chapters supply conflict, OT/CRDT and database reasoning. Source links sit near claims; original numerical estimates explicitly state assumptions. No source is treated as proof of this implementation's correctness.

## Executed validation

Environment: Node v26.7.0; bundled SQLite 3.53.4, obtained from `sqlite_version()`. No external dependencies or containers. Database connections configured journal_mode WAL, synchronous FULL (reported 2), foreign_keys ON and a 3-second busy timeout. The suite asserted WAL/FULL and integrity_check=ok.

Initial 23-test suite passed. After bounded HTTP retry/jitter was added, the expanded suite reported 25 passes, zero failures. Actual client processes received SIGKILL before/after enqueue commit, before/after projection/checkpoint install, and after a server response before local receipt. Actual authority processes received SIGKILL before acceptance commit and after commit before response. Reopened files preserved the declared old/new transaction state. The authority database in these cases is not an unrelated PostgreSQL/container service; the actual SQLite authority process was killed.

Tests additionally cover original ID replay under concurrent HTTP submissions, changed-payload rejection, stale title preservation, dependent-child rejection, independent increments, tombstones, actual change-log pruning, snapshot reconciliation of unknown success, 13-entry numeric pagination, invalid/stale/reordered pages, current revocation, expired fixture credentials, future schema detection, actor binding, epoch review quarantine and finite retry classification.

A lost-response test performs a real successful HTTP submission, consumes its response and injects a transport failure; retry transmits the identical body and stores one increment effect. This is a controlled application response-loss schedule, not a random WAN packet-loss measurement.

Demo observed:

```text
offline: Mira=Plan/2; Dev=Proposal/3
reconnected: title=Proposal; count=5; Mira conflicts=1
resolved: both=Plan + Proposal/5; Mira pending=0
```

Tests/demo create randomized temporary directories and remove their own files after use. The manually documented data directory is not automatically removed. Days offline are modeled through operation ordering, not actual elapsed-day suspension.

## Limits and review needs

No browser, host power-loss, media corruption, long-suspension, disk-full, real token refresh, implemented schema migration, encrypted payload, large/chunked snapshot, multi-tab leader election, multi-authority or production load test is claimed. Fixtures allow trusted local database access; tokens are public and transport is loopback HTTP. Authoritative outcomes and local receipts are retained without GC.

Review should focus on unknown-success reconciliation, cursor/epoch invariants, dependency meaning, authorization boundaries, immutable outcome fingerprints and local backup/restore behavior. The guide remains draft pending that review. No formal ASD-STE100 compliance claim.

Final documentation/CLI checks: a separate disposable workflow executed CLI bootstrap, enqueue, sync, show and fresh-ID title resolution, then confirmed the resolved title on Dev's device. Its server and temporary files were closed/removed. Local targets and balanced code fences passed across 34 Markdown documents excluding node_modules; git diff --check passed. The index's Project B/C rows were joined into the comparison table during final review.
