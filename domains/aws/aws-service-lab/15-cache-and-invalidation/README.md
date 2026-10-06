# 15 — Why can invalidation be followed immediately by a stale cache entry?

**Learner question:** Why can invalidation be followed immediately by a stale cache entry?

State: Database value/version; delayed fill result; cached value with TTL.

Invariant: A guarded fill is accepted only if its observed version still matches authoritative state. TTL bounds this model stale entry lifetime after fill, not a general consistency guarantee.

Read [master chapter 15](../../GUIDE.md#stage-15) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 15
python3 run.py experiments --stage 15
python3 run.py test --stage 15
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original lab 14 is connectivity only. The local model supplies the missing application consistency experiment. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Guard checks use one local authoritative version; distributed atomic guard/invalidation requires additional machinery. No Valkey/Redis protocol, eviction or persistence behavior.
