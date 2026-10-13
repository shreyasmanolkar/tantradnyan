# Mathematical reference: evidence and review notes

Research date: 2026-10-13. The worked numbers are constructed inputs. Source publication dates are separate from crawler dates.

| Evidence | What was checked | Claim boundary |
|---|---|---|
| Little 1961 original publisher abstract | Original finite stationary-mean conditions | No Poisson assumption added to Little's Law |
| Little 2011 author retrospective, full PDF | Sample-path accounting and boundary issues | Mean occupancy identity, not buffer sizing or percentiles |
| MIT 1.041 queueing lecture, spring 2026, full PDF | Standard queue model exposition | M/M/1 result only under its named assumptions |
| RFC 7323, September 2014, IETF full text | §1.1 window and bandwidth-delay constraints | Steady capacity model, not complete TCP throughput model |
| RFC 5905, June 2010, full text | §8 offset/delay exchange | Simplified constant-offset asymmetry calculation; no current NTP implementation claim |
| Mattern 1989 original paper PDF | Vector virtual time and causal relation | Fixed complete participant tracking; no churn compression claim |
| Lamport 1978 author-hosted paper page | Causality and logical order | Arbitrary sorting is not causal metadata |
| Shapiro RR-7506 January 2011, full PDF | §2.3 semilattice construction | Join plus monotonic updates and eventual dissemination; no arbitrary JSON merge guarantee |
| Raft extended paper 2014 | Replicated-state-machine premise | Deterministic transitions and equal initial accepted state |

Reliability products, backlog arithmetic, storage/fan-out calculations and small algebra examples are derived explicitly from declared elementary models. They are not copied measurements. Vector storage estimates use fixed 8-byte counters solely as a constructed representation.

Access notes: RFC Editor rate-limited the RFC 7323 text; full text was accessible through the IETF Datatracker. Little 1961 hosted PDF failed, so its publisher abstract was paired with the author's accessible 2011 retrospective. CRDT RR-7506 full text is accessible through www.lip6.fr, resolving the earlier overview's access gap for the comprehensive report (not proving the earlier SSS PDF was fetched).

Validation: 2026-10-13, Node.js v26.7.0: demo output matched all eight documented lines; direct execution of `model.test.mjs` reported 20 passing tests, zero failures. Checks cover finite fixtures and deterministic schedules, not disk/network guarantees. Technical review: pending. No formal ASD-STE100 compliance claim; official dictionary not consulted.
