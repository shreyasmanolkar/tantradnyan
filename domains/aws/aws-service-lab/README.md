# AWS service lab

Twenty small Python models expose the mechanisms behind AWS service contracts. Read the [master guide](../GUIDE.md), run a stage, explain its failure, then use the [cloud workbook](../CLOUD-LABS.md) or the original [18 AWS labs](../service-lifecycle/04-hands-on-labs.md) to compare it with a real service.

From this directory, with Python 3.10+:

```bash
python3 run.py demo
python3 run.py experiments
python3 run.py test
python3 run.py demo --stage 12
python3 run.py test --stage 20
python3 -B cloud/test_handler.py
python3 -B cloud/build_template.py --check
python3 -B cloud/check_templates.py
```

The runner uses only the standard library and starts independent, bounded subprocesses. The local models call no AWS APIs, open no network listeners, and use temporary directories for SQLite and capstone state. No package installation is needed. Model clocks use logical seconds; illustrative prices are invented input values, not an AWS quote. The envelope model is an authorization model and performs **no cryptography**.

Every stage contains `README.md`, `GUIDE.md`, `src/model.py`, `src/demo.py`, `tests/test_model.py`, `experiments/README.md`, and `experiments/run.py`. Models are independent except for the concepts they build on. They expose a selected mechanism, not an AWS-compatible SDK or emulator.

See the [evidence record](../experiments/README.md) for observed validation scope and the [source map](../references/README.md) for contracts to read. Cloud provisioning is described separately in the workbook; it is never invoked by this runner.

The [cloud handler](cloud/handler.py) is actual Lambda application code; local checks replace its SDK boundary with a small fake. [serverless.json](cloud/serverless.json) is generated from [build_template.py](cloud/build_template.py) and the handler; rerender it after either changes. [events.json](cloud/events.json) is an authored optional fanout/stream template. JSON/reference checks do not establish CloudFormation schema, regional provisioning or live IAM behavior.

## Progression

| Stage | Mechanism | Question |
| --- | --- | --- |
| 01 | [control plane ](01-control-plane/README.md) | Why can an accepted request still produce an unusable resource? |
| 02 | [identity and permissions ](02-identity-and-permissions/README.md) | Which policy permits this exact operation, and which boundary can veto it? |
| 03 | [network paths ](03-network-paths/README.md) | Why does permitting destination port 443 still allow a connection to time out? |
| 04 | [dns and edge ](04-dns-and-edge/README.md) | Why can DNS be correct while a request reaches an old or unhealthy endpoint? |
| 05 | [object storage ](05-object-storage/README.md) | How do whole-object writes, versions and preconditions change concurrent updates? |
| 06 | [block storage ](06-block-storage/README.md) | Which writes belong in a snapshot, and who gives bytes filesystem meaning? |
| 07 | [compute and scaling ](07-compute-and-scaling/README.md) | How many workers are needed, and how much capacity survives an AZ failure? |
| 08 | [container scheduling ](08-container-scheduling/README.md) | Why can a service have free CPU, pending tasks and an unsafe rollout? |
| 09 | [serverless invocations ](09-serverless-invocations/README.md) | Why are warm globals neither durable storage nor reliable deduplication? |
| 10 | [conditional database ](10-conditional-database/README.md) | Why does a strongly consistent read still need a conditional write? |
| 11 | [transactions and recovery ](11-transactions-and-recovery/README.md) | Can a retry receipt and a business effect commit or roll back together? |
| 12 | [queues and workers ](12-queues-and-workers/README.md) | Why is receive neither deletion nor ownership forever? |
| 13 | [pubsub and events ](13-pubsub-and-events/README.md) | How do independent subscribers differ from workers competing for one job? |
| 14 | [streams and checkpoints ](14-streams-and-checkpoints/README.md) | Why can successful processing repeat after a consumer restarts? |
| 15 | [cache and invalidation ](15-cache-and-invalidation/README.md) | Why can invalidation be followed immediately by a stale cache entry? |
| 16 | [secrets and keys ](16-secrets-and-keys/README.md) | Why does rotating a secret not update an already running process? |
| 17 | [observability and slos ](17-observability-and-slos/README.md) | Which missing or aggregated data makes a healthy-looking dashboard misleading? |
| 18 | [iac and deployments ](18-iac-and-deployments/README.md) | What exactly was approved when infrastructure changed? |
| 19 | [cost and resilience ](19-cost-and-resilience/README.md) | Why can two AZs still share one point of failure and one recurring bill? |
| 20 | [operated service ](20-operated-service/README.md) | Can an accepted job survive two independent retry boundaries without repeating its effect? |
