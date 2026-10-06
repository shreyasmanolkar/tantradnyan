# AWS curriculum validation run

- Environment: [environment.json](environment.json); baseline Git revision and working-tree status are recorded there.
- Exact tested code/template hashes: [sources.sha256](sources.sha256).
- Local model suite: [models-tests.log](models-tests.log), exit 0; **42 tests across 20 stages**.
- Worked examples: [demos.log](demos.log), exit 0; all 20 stages.
- Deliberate failure fixtures: [failures.log](failures.log), exit 0; all 20 stages with fixed sequential inputs.
- Actual handler logic with a fake SDK boundary: [handler-tests.log](handler-tests.log), exit 0; **4 tests** for duplicate/conflicting IDs, failure after write and bounded input.
- Generated inline template freshness: [template-freshness.log](template-freshness.log), exit 0.
- Two templates' JSON/logical references/inline Python: [template-references.log](template-references.log), exit 0; not CloudFormation schema validation.
- Workbook Bash syntax: [workbook-shell-syntax.log](workbook-shell-syntax.log), exit 0; blocks parsed without executing them.
- Catalog generation and link validation: [catalog-build.log](catalog-build.log), [catalog-check.log](catalog-check.log), both exit 0; 232 topics, 20 domains and 2 registered browser labs.

Python/SQLite versions and machine UTC timestamp are in the environment file. The run ID uses machine UTC; the local task/source-check date is 2026-10-07 in Asia/Kolkata. Durations in unittest output are incidental functional-check output, not AWS or local throughput measurements.

Observed capstone result: lost dispatch confirmation produced two queue entries; worker restart returned duplicate; queue drained with effect count 1. The 100-job check exercises repeated deliveries and a real local snapshot/reload of the JSON cut; a later job remains absent from that restored cut. SQL backup restored total 7 while the live ledger reached 9. No power-loss experiment was performed.

No AWS credentials were read, AWS calls made, cloud resources deployed, live failure/restore measured or browser UI reviewed. cfn-lint was not installed, so CloudFormation schema validation remains unrun. The original imported API/image/templates were not changed or revalidated by these new checks.
