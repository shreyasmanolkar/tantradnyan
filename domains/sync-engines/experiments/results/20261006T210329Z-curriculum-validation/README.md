# Curriculum validation run

- [Environment and baseline Git revision](environment.json); changes were in the working tree.
- [Exact implementation hashes](sources.sha256) identify tested Node files and package metadata.
- Command from lab root: `npm test`. Exit 0; 43 passed, 0 failed/cancelled/skipped.
- Command from lab root: `npm run faults`. Exit 0; six seeded protocol variants plus bounded editor comparison and authoritative game.
- [Raw tests](tests.log) and [raw fault observations](faults.log).
- [Catalog build](catalog-build.log) and [catalog check](catalog-check.log) record a pre-existing missing-topic blocker.
- [New-guide link check](curriculum-links.log) isolates the new documentation's local links.

Logical simulation time is milliseconds in the event model; runtime output durations are not benchmark data. Source checking and local IST task date were 2026-10-07; this run identifier uses the machine's UTC timestamp. No graphical browser UI was implemented or reviewed.

One initial integration attempt timed out because the test waited for a close event after it could already have fired. Waiting for that event before killing the child server corrected the harness race. The final output above is the post-correction result. The failure was in test observation order, not evidence of a different durability contract.
