# 11 — Can a retry receipt and a business effect commit or roll back together?

**Learner question:** Can a retry receipt and a business effect commit or roll back together?

State: SQLite receipts table keyed by job ID; balance row; WAL-backed local database; backup file.

Invariant: A new receipt and balance update share one SQL transaction. The same ID/amount does not apply again; different content under that ID is rejected.

Read [master chapter 11](../../GUIDE.md#stage-11) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 11
python3 run.py experiments --stage 11
python3 run.py test --stage 11
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original labs 8–9 and 17. Local SQLite is actual SQL behavior, not a PostgreSQL/RDS isolation or HA test. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Single local ledger, SQLite BEGIN IMMEDIATE and ordinary file backup/reopen. No RDS deployment, engine equivalence, power-loss test or multi-service transaction.
