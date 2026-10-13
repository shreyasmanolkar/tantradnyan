# Collaboration evidence and validation record

Status: ready (educational evidence record). Evidence/validation checked 2026-10-13. Reviewer: Codex (AI technical/editorial review), 2026-10-14.

## Product evidence boundaries

- [Figma, Evan Wallace, October 16, 2019](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/): historical author report of document/property/tree synchronization. Its current page availability does not make its 2019 internals current. The guide's cycle/transform/rank examples are independent authored design reasoning.
- [Notion, Jake Teton-Landis, May 18, 2021](https://www.notion.com/blog/data-model-behind-notion): historical blocks, render links, permission parent and transaction-queue model. Not evidence of its entire present protocol.
- [Linear, Tuomas Artman, June 29, 2023](https://linear.app/now/scaling-the-linear-sync-engine): landing page for a technical talk. Talk content was not reviewed; landing text supplies no detailed conflict algorithm claim.
- Google Drive's official September 2010 OT/protocol articles were found, but full pages returned a 429 and a blocked redirect. Search excerpts were not used as proof of present Google Docs internals. The guide describes Google Docs-style requirements, not a verified current implementation. Located URLs: [protocol article](https://drive.googleblog.com/2010/09/whats-different-about-new-google-docs.html), [OT article](https://drive.googleblog.com/2010/09/whats-different-about-new-google-docs_22.html).
- [Microsoft Live Share security](https://learn.microsoft.com/en-us/visualstudio/liveshare/reference/security): substantive content was accessible despite authorization banners; page reports last update 2022-11-21. Supports separating edit/debug/terminal access. Detailed terminal-only URL and VS Code landing page failed to fetch; no claim relies on their unread contents.

No Slack/Discord present internal architecture is inferred. Category matrices are reference design options with qualitative latency descriptions, not measured proprietary benchmarks.

## Library and implementation sources

[Yjs updates](https://docs.yjs.dev/api/document-updates), [Y.Text](https://docs.yjs.dev/api/shared-types/y.text), [relative positions](https://docs.yjs.dev/api/relative-positions), [UndoManager](https://docs.yjs.dev/api/undo-manager) and [Awareness](https://docs.yjs.dev/api/about-awareness) were read. Library APIs and provider responsibilities remain separate. Project D implements custom session presence, not the Awareness wire protocol or y-websocket interoperability.

[Yjs tagged 13.6.33 encoding source](https://github.com/yjs/yjs/blob/v13.6.33/src/utils/encoding.js) and installed source were inspected for pendingStructs/pendingDs state encoding. The source plus actual persisted-missing-dependency test supports the narrow snapshot behavior used here. Yjs internal client IDs are not authenticated authorship.

Versions were checked through npm before installation: yjs 13.6.33 and ws 8.22.0. Exact pins and transitive dependencies are locked. npm install --ignore-scripts reported four added packages and zero audit findings at that time. No complete dependency/security audit is claimed.

## Executed checks

Environment: Node v26.7.0, SQLite 3.53.4, yjs 13.6.33, ws 8.22.0. SQLite WAL and synchronous FULL configured. Client state and undo queues are memory-only; server state and update blobs are file-backed.

Initial 17 tests passed. After adding explicit unsupported-protocol coverage and an in-flight send regression, the expanded suite reported 18 passes, zero failures. Actual WebSocket/SQLite cases cover offline concurrent inserts, selective undo/redo, relative anchors, expiry, UTF-16 boundaries, read-only forged frames, current revocation, bad binary/schema/root, duplicate reauthorization, pending dependency snapshot/reopen, epoch refusal and rapid editing. Crash cases use real server subprocess SIGKILL before commit and after commit before ACK, then reopen and reconnect the same surviving client.

The missing-dependency restart test closes the original store before reopening its file, preserving the single-owner assumption. Equal insertion-vector/deletion-divergence is a pure library test, not a network fault injection. Blob deduplication is exact-byte replay; multiple encodings of overlapping CRDT evidence can create several log rows while retaining one logical character effect.

Demo observed concurrent private branches, equal merged text containing both contributions, and Hello Dev after Mira's undo. Exact concurrent insertion order is intentionally not hardcoded. A Node/lib0 localStorage ExperimentalWarning occurred; no localStorage-backed client persistence was used or claimed.

Tests/demo create randomized disposable directories and close their owned sockets/processes/stores. Manual data files persist for inspection.

## Review gaps

No browser/graphical/rich-text binding, persistent client CRDT store, client-kill durability, host power loss, WAN congestion, multi-owner failover, encryption, real identity, large bootstrap or exhaustive hostile-encoding fuzzing was tested. Candidate validation checks integrated projection/root/size and retains bounded unresolved evidence; it cannot fully validate hidden pending semantics before dependencies arrive. Only one server owner is supported. Safe compaction and rejected private-branch export remain production work.

Review should check origin/undo handling, insertion/delete exchange, epoch boundaries, server commit/ACK sequencing, deferred structures, permission enforcement and explicit scope limits. No formal ASD-STE100 compliance claim.

Final checks: documented npm test and npm run demo were rerun successfully: 18 passes, zero failures; the demo matched its three documented result lines. A separate spawned CLI workflow exercised offline/online, insert, flush, undo, redo, show and quit, confirming the committed text and empty pending queue. Its server/files were closed/removed. Local path targets/code fences passed across 37 Markdown documents excluding node_modules; new-file whitespace and git diff --check passed.

## Release review — 2026-10-14

Current status: ready for the stated educational scope. Reviewer: Codex (AI technical and editorial review); no independent human review claimed. Historical research/execution notes above retain their original scope and do not imply every cited full text was newly fetched. The [review record](../REVIEW.md) supersedes earlier pending-review/planned-work statements; [VALIDATION.json](../VALIDATION.json) records this release's actual reruns.

Open issues: none blocking this educational release. Scope limits and further validation: Plain-text CLI/provider and dated product evidence; no durable CRDT client, graphical rich-text binding or current private vendor architecture claim.
