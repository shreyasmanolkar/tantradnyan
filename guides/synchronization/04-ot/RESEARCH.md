# OT evidence and validation

Research date: 2026-10-13.

- Ellis/Gibbs 1989 original PDF on SIGMOD Record: motivation and pairwise transformation condition, not endorsement of its historical algorithm for production.
- Randolph, Boucheneb, Imine and Quintero, *On Consistency of Operational Transformation Approach*, EPTCS 107 (2013), full original PDF: simple-signature TP1/TP2 limitations are bounded by the paper's model. Broad abstract wording is not generalized to every OT control algorithm.
- Wei, Huang and Lu, *Specification and Implementation of Replicated List: The Jupiter Protocol Revisited*, OPODIS 2018 extended paper: client/server state spaces and algorithm-specific correctness. Original Jupiter 1995 paper located but mirror fetch failed; not represented as full-text-read evidence.
- Unicode UAX #29 revision 49, Unicode 18.0.0, dated 2026-09-01: versioned report opened for segmentation. This does not assert a runtime's Unicode version.

Transforms, the pair test alphabet, the bounded two-client round and TP2 regression witness are authored educational examples. The guide separates protocol obligations from executable scope. It does not claim to implement Jupiter or a complete editor.

Validation: Node.js v26.7.0, 2026-10-13. Demo matched all five documented lines. Direct test-module execution reported 10 passing tests and zero failures, including 220 valid operation pairs and the expected failing TP2 property. A green counterexample regression means the unsupported general property remains false.

No real transport, disk crash recovery, continuous editor or IME testing. Technical reviewer: pending. Formal ASD-STE100 compliance not claimed.
