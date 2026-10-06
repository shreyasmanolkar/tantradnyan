# AWS curriculum experiments and evidence

[Domain entry](../README.md) · [Master guide](../GUIDE.md) · [Local lab](../aws-service-lab/README.md) · [Cloud workbook](../CLOUD-LABS.md) · [Learner record template](TEMPLATE.md)

## Hypotheses

1. A stale conditional write cannot overwrite a newer accepted item/object under the model predicate.
2. A work/stream delivery can repeat after a crash; durable effect/receipt coupling prevents another business effect under the stated transaction boundary.
3. A delayed cache fill after invalidation can restore stale data; the model's local version guard rejects that fill.
4. A snapshot contains one consistent accepted cut; later accepted work can be missing after restoring it.
5. Separate permission, route/filter, identity, revision/health and capacity failures require separate observations.

## Setup and controls

Twenty independent Python 3.10+ models use explicit fixed inputs and sequential events. Time values are logical seconds, not AWS latency. No randomness or seeded workload is hidden in the models. SQLite and the file-backed capstone use private temporary directories. The capstone's 100-job check is a correctness fixture, not a capacity benchmark.

The handler check supplies an SDK fake; it never contacts DynamoDB. Template checks parse JSON, resolve local logical references and compile the embedded Python. They do not validate CloudFormation schema or provision resources. The key/envelope model stores plaintext behind an opaque token; it performs no encryption.

## Drivers and expected outcomes

From `domains/aws/aws-service-lab`:

```bash
python3 run.py test
python3 run.py demo
python3 run.py experiments
python3 -B cloud/test_handler.py
python3 -B cloud/build_template.py --check
python3 -B cloud/check_templates.py
```

Expected examples: queue hidden at second 4 and redelivered at 5; fresh receipt differs; cache naive value is old while guarded value is new; SQL snapshot total is 7 while live total is 9; capstone lost confirmation creates two queued copies, worker restart reads its receipt, and effect count remains 1. Each stage's own `tests/test_model.py` supplies an independent boundary/counterexample.

## Actual observations

[Run 20261006T220002Z-aws-curriculum-validation](results/20261006T220002Z-aws-curriculum-validation/README.md) recorded **46 passing tests**: 42 local model checks and 4 handler checks with an SDK fake. All 20 demos and all 20 deterministic failure drivers exited 0. Template freshness, JSON/logical-reference/inline-Python checks and workbook shell parsing passed. Raw output, environment and exact code/template hashes are linked in the run record.

The capstone ended with two delivered queue copies, one committed effect and an empty queue; worker replay returned duplicate. SQLite restored total 7 while the live total was 9. The cache fixture showed old data after naive refill and new data under its local version guard.

Cloud labs are **not run** by this curriculum task; reader account/region/IAM, service capacity, billing and live failure/restore observations require separate records. cfn-lint is unavailable here, so schema checks are also unrun. Runtime durations in raw output are not benchmark results.

## Evidence limits

Local checks support the named state transitions under their fixed schedules. They do not establish real IAM evaluation, AWS API reliability, SQS delivery guarantees, Kinesis resharding, Lambda runtime performance, RDS failover, regional availability, price quotes, cloud throughput, browser UI behavior or power-loss durability. No learner milestone is marked verified from these generated checks.

The original imported 23 files retain their hashes and historical observations. Preserve those records separately from new experiments. Use the [template](TEMPLATE.md) to keep predictions, actual output, cleanup and next questions distinct.
