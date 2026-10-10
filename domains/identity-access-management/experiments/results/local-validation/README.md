# Sanitized local validation artifacts

- [Environment](environment.json): tool/runtime scope, base revision and working-tree context.
- [Node tests](node-tests.log): 23 passing tests; durations are runner diagnostics, not benchmarks.
- [PostgreSQL test](postgres-tests.log): one passing isolated-database test.
- [Browser review](browser.log): password/session/tenant/logout and full local OIDC round-trip.
- [Stage drivers](demos.log): all 22 sanitized drivers; integration-summary outputs are not extra protocol measurements.
- [Catalog build](catalog-build.log), [catalog check](catalog-check.log), [dependency-doc regression](catalog-regression.log).

Commands/run assumptions and deliberately unrun work are in [the evidence ledger](../../README.md). No raw credential or assertion artifacts are stored here.
