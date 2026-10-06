# 18 — What exactly was approved when infrastructure changed?

**Learner question:** What exactly was approved when infrastructure changed?

State: Actual and desired resource maps; immutable plan with base fingerprint; replacement-property list.

Invariant: Execute the reviewed desired state, tied to its observed base in this model. A replacement is distinct from an in-place update.

Read [master chapter 18](../../GUIDE.md#stage-18) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 18
python3 run.py experiments --stage 18
python3 run.py test --stage 18
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original labs 6 and 11. Real CloudFormation is not an atomic map replacement and does not inherit the model base-fingerprint guarantee. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** One atomic in-memory application; no cloud API failures, dependency graph, rollback, IAM, replacement lifecycle or real drift detector.
