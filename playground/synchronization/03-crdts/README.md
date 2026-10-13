# CRDT laboratory

Requires Node.js 18 or later, no dependencies. Counter components use `BigInt`. Run from the repository root:

```sh
node playground/synchronization/03-crdts/demo.mjs
node --test playground/synchronization/03-crdts/model.test.mjs
```

For individual test output, run `node playground/synchronization/03-crdts/model.test.mjs` directly.

```text
03-crdts/
  model.mjs          datatype representations, local transitions, joins, projections
  demo.mjs           divergence/merge histories and semantic counterexamples
  model.test.mjs     finite join-law tests, replay, delayed dependencies and limits
  README.md          setup, walkthrough and hardening requirements
```

The [CRDT guide](../../../guides/synchronization/05-crdts/README.md) derives each representation and rule. The G-set, 2P-set, G/PN counters, compact dot/context MV-register, fixed-key LWW map, anchor sequence and per-element rich text are implemented here. LWW and the tombstone OR-set reuse the explicitly bounded earlier lab.

Expected demo:

```text
G-set: D,M
2P-set after removal: 0 members; re-add forbidden
G-counter: 5
PN-counter independent stock decrements: -1
MV title alternatives: Plan,Proposal
MV after resolution and stale replay: Project plan
map after deletion and stale replay: 0 keys
sequence merged: cXaYt
sequence after deleting anchor c: Xat
rich text explicit marks: ca*Yt
OR-set remove/unseen-add: urgent
```

## Critical functions and assumptions

`mergeG` takes the maximum cumulative count per exclusive writer, then `gValue` sums components. Duplicate snapshots do not inflate totals. Two unsynchronized devices sharing the same writer identity violate this model; the regression example loses one increment. `pnDec` advances negative evidence; it does not establish a nonnegative inventory rule.

`mvAssign` allocates one dot `(actor,counter)`, supersedes all observed candidates, and preserves the causal context. `mergeMV` retains a candidate present on both sides or absent from the other side's context. Absence plus context coverage means superseded, not never seen. The context assumes a causally closed, gap-free per-actor object write history and exclusive persistent actors. Only well-formed states generated under those assumptions are admitted; this is not a parser for hostile wire data.

`mapWrite`/`mergeMap` maintain a fixed-key product of LWW cells. Erasing a key stores a tombstone cell. A `null` live value is different from a deleted key. This is not an observed-remove nested map; remove-versus-update and subtree recreation need additional policies.

`seqInsert` allocates a causality-respecting Lamport identity and anchors to a known element, including a deleted one. `receiveNode` admits delayed ancestors as pending evidence. `seqView` traverses sibling subtrees in descending `(clock,actor)` order, hides removed elements but still visits their descendants. Missing-anchor descendants remain unresolved until their evidence arrives. Every node holds one Unicode scalar; grapheme clustering is an editor concern. This is an educational insertion-tree design, not a byte-compatible RGA/Yjs/Automerge implementation, and has no general move operation.

`markIds` applies a boolean mark to an explicit list of observed element IDs using LWW cells. It converges as a product with the sequence, but unseen inserted characters do not inherit formatting. This deliberately differs from span-boundary rich-text intent models such as Peritext. It is useful for showing why convergent marks alone are insufficient for a polished editor.

Walkthrough: run the demo; inspect counter components; inspect MV entries plus context after resolution; reverse the sequence branches; delete `S:1` and confirm its children survive; finally compare explicit formatting of `a` with the concurrently inserted `Y`. Check the guide's corresponding intermediate-state tables.

## Tests and limitations

Tests examine join associativity, commutativity and idempotence on finite compatible fixtures; all three-branch snapshot permutations and repeated snapshots where relevant; causally superseded values; removal-before-addition; delayed sequence ancestors; Unicode boundaries; identity reuse; unsafe collection/format reclamation; and nonnegative-inventory failure. Dropped state messages are represented by omission followed by later aggregate catch-up, not real sockets. An update never transmitted again cannot be recovered algebraically.

No class implements crash durability, reliable dissemination, server permission checks, malicious-client validation, membership replacement or production compaction. Raw maps/sets are exposed for inspection and must be treated as immutable. Reusing actors after restoring an old snapshot is unsafe.

Costs: G/PN counters and causal contexts grow with writer count; OR evidence grows with additions/removals; sequence nodes and deletion IDs grow with editing history; per-character marks multiply selected-span work by span length. The simple implementation clones state repeatedly and sorts for projection, so its costs exceed optimized bulk union/tree-index designs. Full text rebuilding on each edit is unsuitable for large documents. `BigInt`, maps and sets need an explicit lossless wire codec; ordinary JSON does not encode them as intended.

Production hardening requires pinned implementations, validated types and identities, durable local state/outboxes, bounded input/metadata, server-side authorization, anti-entropy/catch-up, schema evolution, history-generation/reset policy, safe reclamation and integration tests across actual crashes. Mathematical convergence does not enforce inventory, access or rich-text intent.

Validation: 2026-10-13, Node.js v26.7.0: demo matched 11 documented lines; direct test execution reported 23 passing tests, zero failures. Finite fixtures and memory-only histories; no disk/network guarantees.

Release review: 2026-10-14, Codex (AI technical/editorial review). Status: ready for this exercise's stated scope. [Review and rerun evidence](../../../guides/synchronization/REVIEW.md) record the actual checks; production-hardening limitations above still apply.
