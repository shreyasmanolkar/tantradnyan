# Foundation lab

Requires Node.js 18 or later for ES modules and `node:test`; no dependencies or installation. This is a constructed single-process model. It does not implement networked or persistent projects A–G.

From the repository root:

```sh
node playground/synchronization/00-foundations/demo.mjs
node --test playground/synchronization/00-foundations/foundations.test.mjs
```

Directory:

```text
00-foundations/
  model.mjs                 conditional records, replay boundary, text and clocks
  demo.mjs                  explicit schedules and expected outcomes
  foundations.test.mjs      counterexamples plus contract assertions
  README.md                 setup, limits and walkthrough
```

Expected demo output:

```text
lost update: 1 (two intended increments)
CAS retry: 2
replayed identity: 1; new identity: 2
M then D: cXYat; D then M: cXaYt
vector relation: concurrent
```

`VersionedRecord.compareAndSet` checks the version and mutates without an `await`, so calls are serialized by this one JavaScript execution context. This is not a cross-machine atomic primitive. A successful call increments its version. The losing caller must decide whether rereading and recomputing is semantically valid.

`DedupCounter.submit` records the effect and response together in synchronous memory. It checks payload reuse and returns the original result on duplicates. Replace the map and counter with one durable transaction for crash safety; persistence of just one side leaves an ambiguity.

`insert` uses ASCII-only positions in this lab. The divergent results show that original offsets do not commute. `relation` compares complete equal-length vector counters; vectors that dominate indicate ancestry under the vector-clock protocol. It does not infer clock history from arbitrary supplied numbers.

Tests deliberately include a lost update and divergent text orders as counterexamples. Passing these tests means the examples behave as documented, not that their unsafe algorithms are acceptable. Additional tests reject obsolete versions and conflicting identity reuse.

Failure variation: remove replay records, then resend an increment. It applies again. Restore old snapshots without preserving identity state and the same issue returns. Production hardening needs storage transactions, validated operations, persisted identities, retry retention, authorization, history generations, backpressure and real crash/restart tests.

Performance: record access and dedup lookup are expected constant time in this model; identity storage grows with unique submissions; text insertion copies strings; vector comparison is linear in participant count. No benchmark results are claimed.

Validation record: 2026-10-13, Node.js v26.7.0. The demo produced the documented five lines. Direct execution of `node playground/synchronization/00-foundations/foundations.test.mjs` reported six passing tests and zero failures. `node --test` also exited successfully; its reporter in this environment summarized one file-level subtest, so the direct run was used to confirm the six individual assertions. No network or persistence validation is implied.

Release review: 2026-10-14, Codex (AI technical/editorial review). Status: ready for this exercise's stated scope. [Review and rerun evidence](../../../guides/synchronization/REVIEW.md) record the actual checks; production-hardening limitations above still apply.
