# 14 — Why can successful processing repeat after a consumer restarts?

**Learner question:** Why can successful processing repeat after a consumer restarts?

State: Append-only shard records; per-shard sequence; independent consumer checkpoints.

Invariant: Order exists within each model shard. Checkpoints are monotone processed-prefix claims; another consumer has its own position.

Read [master chapter 14](../../GUIDE.md#stage-14) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 14
python3 run.py experiments --stage 14
python3 run.py test --stage 14
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Kinesis source-reading exercise; optional cloud experiment requires an owned stream with reviewed retention, capacity and cleanup. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Fixed shard count, toy SHA-256 hash, zero-based integer offsets and no retention/resharding. These are not Kinesis hash ranges, sequence values or exactly-once delivery.
