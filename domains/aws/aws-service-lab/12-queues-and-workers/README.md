# 12 — Why is receive neither deletion nor ownership forever?

**Learner question:** Why is receive neither deletion nor ownership forever?

State: Message bodies; receive counts; visibility deadlines; changing receipt handles; dead-letter list.

Invariant: A hidden message can reappear. Acknowledgement uses the current delivery receipt in this model; repeated failure eventually moves the message to the DLQ.

Read [master chapter 12](../../GUIDE.md#stage-12) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 12
python3 run.py experiments --stage 12
python3 run.py test --stage 12
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Workbook C and original lab 13. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Deterministic toy queue has no spontaneous duplicate or reorder; retries demonstrate the need for idempotency. Its stale-handle rejection is stronger than the AWS DeleteMessage response semantics. No FIFO implementation.
