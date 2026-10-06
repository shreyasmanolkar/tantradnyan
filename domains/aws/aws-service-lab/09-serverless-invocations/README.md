# 09 — Why are warm globals neither durable storage nor reliable deduplication?

**Learner question:** Why are warm globals neither durable storage nor reliable deduplication?

State: Finite active execution slots; reusable environments; environment-local cache.

Invariant: Busy slots cannot execute another invocation in this model. Recycling an environment discards its cache.

Read [master chapter 9](../../GUIDE.md#stage-09) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 09
python3 run.py experiments --stage 09
python3 run.py test --stage 09
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Workbook E; current runtime table and Lambda asynchronous-retry contract. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Pool semantics are selected assumptions, not exact Lambda scheduling, scaling quotas, billing or retry timing. Reserved and provisioned concurrency are different real configurations.
