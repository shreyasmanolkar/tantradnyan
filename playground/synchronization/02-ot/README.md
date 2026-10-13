# OT laboratory: a correct pairwise diamond and a failing third path

Requires Node.js 18 or later; no dependencies. Run from the repository root:

```sh
node playground/synchronization/02-ot/demo.mjs
node --test playground/synchronization/02-ot/model.test.mjs
```

Directly run `node playground/synchronization/02-ot/model.test.mjs` to see individual tests if the runner summarizes at file level.

```text
02-ot/
  model.mjs          bounded transforms, one-round authority, cursors, TP2 witness
  demo.mjs           explicit concurrent schedules
  model.test.mjs     exhaustive small TP1 pairs and counterexample regressions
  README.md          scope, execution and hardening requirements
```

Expected demo:

```text
optimistic views: cXat, caYt
transformed results: cXaYt, cXaYt
same deletion: ct; remote kind=noop
one-round server and clients: cXt, cXt, cXt
TP2 counterexample: XYb != YXb
```

`transform(a,b)` returns `a` expressed after concurrent `b`, assuming both refer to a common base. `diamond` applies each local operation first and then the other's transformed operation. `oneRound` adds a selected server order and acknowledgment identities; its admitted workload is exactly two concurrent operations, one per client. A fresh round requires a common settled base. It has no continuous pending buffer, reconnect, persistence or network service.

`tp2Witness` deliberately exposes the lost-position context of this basic transform signature. The implementation passes the documented pairwise cases and **fails** the stronger path property. The passing regression test expects that failure. This code must not be extended into a general editor by adding a socket or arbitrary operation queue.

`mapCursor` illustrates a separate presence policy: a boundary can stick before or after a new insertion. It maps offsets only and is not a grapheme-aware selection or IME integration.

The guide derives each rule and the regression witness: [OT](../../../guides/synchronization/04-ot/README.md). Adjacent CRDT implementations use a different state representation.

Operations are printable ASCII, one inserted/deleted character and a stable ASCII ID. Bounds are checked when applying to a document. Identity comparison uses JavaScript's fixed string order over ASCII, not locale sorting. Inputs to a transform must be concurrent and share context; the function cannot infer that from offsets alone. Replacement is two dependent operations, not one universally atomic intention.

All tests are finite fixtures: 220 valid operation pairs on lengths 0–4, named concurrency examples, a TP2 witness, cursor boundaries and validation errors. They do not prove arbitrary-history convergence. Drop one accepted operation permanently and convergence is not promised; duplicate a raw insertion and it applies twice unless a protocol deduplicates it.

Performance: transforms are constant work for this signature; string application copies `O(n)` characters. Real pending queues, rich-text transforms, storage and transport add costs. Hardening requires a complete control algorithm with a matching proof, durable IDs/logs, reliable catch-up, rejected-edit repair, authorization, schema/indexing versions, IME handling, grapheme integration and failure tests. The lab's explicit scope restriction is part of its correctness claim.

Validation: 2026-10-13, Node.js v26.7.0: demo matched five documented lines; direct test execution reported 10 passing tests, zero failures, including 220 pair cases and the expected TP2 counterexample. Memory-only.

Release review: 2026-10-14, Codex (AI technical/editorial review). Status: ready for this exercise's stated scope. [Review and rerun evidence](../../../guides/synchronization/REVIEW.md) record the actual checks; production-hardening limitations above still apply.
