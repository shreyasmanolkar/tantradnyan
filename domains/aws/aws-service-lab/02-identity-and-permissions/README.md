# 02 — Which policy permits this exact operation, and which boundary can veto it?

**Learner question:** Which policy permits this exact operation, and which boundary can veto it?

State: Statements with effect, action patterns, resource patterns, equality conditions; optional permissions boundary; session expiry.

Invariant: An applicable explicit deny wins. A boundary limits a grant; it cannot create one.

Read [master chapter 2](../../GUIDE.md#stage-02) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 02
python3 run.py experiments --stage 02
python3 run.py test --stage 02
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Workbook A; original lab 2 and the IAM foundations chapter. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Only identity policies, simplified string patterns/equality and one boundary. No Principal, NotAction, resource-policy sessions, SCP/RCP hierarchy, cross-account, KMS key-policy evaluation or full IAM condition semantics.
