# CRDT evidence and validation

Research date: 2026-10-13. Constructed examples and implementations are explicitly educational.

| Evidence | Read scope | Boundary |
|---|---|---|
| Shapiro et al. RR-7506, January 2011, full PDF | §2.3 sufficient constructions and datatype portfolio | No arbitrary-JSON convergence claim; classic op delivery assumptions distinguished |
| Gomes et al. OOPSLA 2017, author-hosted original PDF | Network/identity model and verification framework | Its formal proofs do not transfer to this lab's insertion tree |
| Bieniusa et al. 2012 original report | Observed-remove semantics and context optimization | Lab uses retained tombstones, not optimized ORSWOT |
| Almeida/Shoker/Baquero 2016 preprint, journal 2018 | Delta-state fragments and causal-merging conditions | Context compression assumes causally closed prefixes |
| Kleppmann/Beresford 2016 original JSON CRDT paper | Structured map/list/delete semantics | Lab fixed-key map is a simpler product, not this whole algorithm |
| Kleppmann et al. PaPoC 2019 | Interleaving anomalies | Convergence does not imply all desired word/run properties |
| Weidner/Kleppmann 2023 Fugue preprint | Stronger non-interleaving target | No claim the lab sequence satisfies FugueMax's specification |
| Litt/Lim/Kleppmann/van Hardenberg 2022 Peritext | Formatting anchored to stable text and explicit intent scenarios | Lab per-element booleans do not implement Peritext |
| Yjs official APIs | Updates, relative positions, Y.Doc GC/identity and awareness | Documentation snapshot 2026-10-13; no package installed or pinned |
| Automerge official documentation/API | Conflicts, counters, rich text, concepts and Rust sync assumptions | Documentation snapshot, distinct datatype/peer-protocol requirements |

The compact MV register retains causal context while pruning payloads. Its representation assumes one exclusive writer per actor and a gap-free per-object prefix. The sequence is a retained insertion tree with ordered siblings, explicitly authored here; its convergence argument is union plus deterministic projection, not a copied library proof. Rich text is a product with per-element LWW booleans and intentionally lacks span inheritance.

Validation: Node.js v26.7.0, 2026-10-13. Demo matched all 11 documented lines. Direct test-module execution reported 23 passing tests, zero failures. Tests include finite join-law triples, snapshot permutations, stale MV replay, identity misuse, tombstone resurrection, delayed anchors, Unicode scalars and formatting limits.

No sockets, crash durability, malicious-wire parsing or production library integration tested. All raw maps/sets are treated as immutable by callers. Review: pending technically informed reader; no formal ASD-STE100 compliance claim.
