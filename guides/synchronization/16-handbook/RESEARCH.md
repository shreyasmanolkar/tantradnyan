# Handbook evidence and validation

Status: ready (educational evidence record). Scope date: 2026-10-14. Reviewer: Codex (AI technical/editorial review), 2026-10-14.

## Evidence method

Project source and READMEs were inspected for actual commands, dependencies, transaction boundaries, process/storage scope and omissions. Existing A–D/F/G validation records are historical local executions from installments 4–10; they are not new executions by this handbook. Version pins and reported counts were preserved with their scope. No aggregated test total is used to imply all projects were rerun together.

Primary pages checked this installment: [PostgreSQL 18 transaction isolation](https://www.postgresql.org/docs/18/transaction-iso.html), [Yjs updates](https://docs.yjs.dev/api/document-updates), [RFC 8085](https://www.rfc-editor.org/rfc/rfc8085.html), and the [FoundationDB 2021 paper](https://www.foundationdb.org/files/fdb-paper.pdf). Claims about authored code are checked against that code and its tests. APIs/runtime guarantees do not replace storage/process tests.

## Project E

New adapter reuses `03-crdts/model.mjs` and the logical scheduler/journal in G. It sends complete compatible in-memory states and explicitly heals delivery with a full-state exchange after the faulted workload. Four datatype adapters run ten seeds twice. Seven new tests passed; the 23 existing datatype tests also passed on Node 26.7.0. Initial demo review corrected MV alternative output to its actual ID-sorted order: Proposal then Plan. No semantic test was weakened. Tests compare canonical metadata and projections, plus writer-reuse and inventory counterexamples.

The original combined `node --test` invocation summarized two files under this environment. The package command now directly executes both test modules, exposing 23 and seven individual passing tests. This is 30 tests, of which 23 are reused. No actual sockets, persistent writer storage, adversarial decoding or garbage collection is claimed for E.

## Limitations

A/B database containers were not recreated for this documentation installment. Their exact setup, cleanup and historical results remain in their project READMEs. Other projects' historical results are not renamed as new checks. Independent fresh-checkout reproduction, cross-platform behavior, network/cluster/storage failure, production auth/encryption and safe metadata GC remain open.

Template review: audience/questions, boundaries, setup, source linkage, representative mutation investigation, alternatives, troubleshooting, security and review gaps are included. The release review below records the technically focused AI checks; independent human review remains an additional validation path. Plain-language principles applied; no formal ASD-STE100 compliance claim.

## Final execution checks

The documented Project E `npm test` and `npm run demo` commands were rerun successfully: 23 shared datatype tests and seven adapter tests passed, zero failures; all four expected demo lines matched. Project G was also rerun as a regression for the shared scheduler and fault boundaries: 25 tests passed, zero failures, and its demo reproduced seed 7 with 16 original operations, count 30, head 16 and a valid anchored trace. A–D/F were not separately rerun in this installment.

Local Markdown targets and code fences passed across 55 documents, excluding node_modules. New-file whitespace and git diff --check passed. The tests cleaned their disposable fixture files/processes/sockets. No database containers were started by this installment.

## Release review — 2026-10-14

Current status: ready for the stated educational scope. Reviewer: Codex (AI technical and editorial review); no independent human review claimed. Historical research/execution notes above retain their original scope and do not imply every cited full text was newly fetched. The [review record](../REVIEW.md) supersedes earlier pending-review/planned-work statements; [VALIDATION.json](../VALIDATION.json) records this release's actual reruns.

Open issues: none blocking this educational release. Scope limits and further validation: All runnable projects checked in this environment; independent fresh-machine reproduction and production certification are not claimed.
