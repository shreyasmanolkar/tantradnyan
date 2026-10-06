# 20 — Can an accepted job survive two independent retry boundaries without repeating its effect?

**Learner question:** Can an accepted job survive two independent retry boundaries without repeating its effect?

State: File-backed commands; unpublished outbox entries; duplicate queue entries; processed results/receipts; effect count.

Invariant: A stable command ID identifies one payload. Receipt and effect commit together. A repeated delivery reads the receipt and applies no new effect.

Read [master chapter 20](../../GUIDE.md#stage-20) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 20
python3 run.py experiments --stage 20
python3 run.py test --stage 20
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Workbook D/E demonstrate a narrow real conditional receipt. Original container labs supply the operated deployment. This capstone is a local mechanism integration. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Single writer, one JSON transaction file and sequential worker; no distributed broker, AWS durability, lease, auth service, fsync-based power-loss guarantee or atomic transaction across AWS services.
