# 01 — Why can an accepted request still produce an unusable resource?

**Learner question:** Why can an accepted request still produce an unusable resource?

State: Request-token map; desired resource configuration; pending/failed/ready status.

Invariant: The same token and intent return the same resource ID. Acceptance is distinct from readiness.

Read [master chapter 1](../../GUIDE.md#stage-01) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 01
python3 run.py experiments --stage 01
python3 run.py test --stage 01
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original labs 3 and 6: stack events and target health; use the existing reviewed-change-set loop. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Tokens are application data here. Real APIs differ in token support, scope, retention and mismatch behavior. No quotas, control-plane replication, or authentication.
