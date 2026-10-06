# 10 — Why does a strongly consistent read still need a conditional write?

**Learner question:** Why does a strongly consistent read still need a conditional write?

State: Authoritative items with versions; delayed read replica; deterministic toy partition assignment.

Invariant: Compare the expected version inside the write. Only one competing writer from that version can succeed.

Read [master chapter 10](../../GUIDE.md#stage-10) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 10
python3 run.py experiments --stage 10
python3 run.py test --stage 10
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Workbook D. The AWS read-consistency choices differ for table/LSI versus GSI and for global-table modes. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** One in-memory primary, one manually advanced replica and a fixed SHA-256 partition hash. No DynamoDB physical partitioning, transactions, adaptive capacity, TTL service or global table implementation.
