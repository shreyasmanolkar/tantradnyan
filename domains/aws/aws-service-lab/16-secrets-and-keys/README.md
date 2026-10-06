# 16 — Why does rotating a secret not update an already running process?

**Learner question:** Why does rotating a secret not update an already running process?

State: Current secret value/generation; captured task environment; opaque sealed record, context, key-state and principal gates.

Invariant: Captured configuration is a snapshot. An allowed decrypt-style operation must also have the right context and enabled key in this model.

Read [master chapter 16](../../GUIDE.md#stage-16) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 16
python3 run.py experiments --stage 16
python3 run.py test --stage 16
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original lab 9 and the documented app-secret rotation limitation; current KMS and Secrets Manager contracts. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** All values are synthetic. The opaque-token store retains plaintext and performs no encryption; it is never a cryptographic reference implementation or secret store.
