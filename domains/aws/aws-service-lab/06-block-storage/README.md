# 06 — Which writes belong in a snapshot, and who gives bytes filesystem meaning?

**Learner question:** Which writes belong in a snapshot, and who gives bytes filesystem meaning?

State: Durable block map and a separate volatile pending-write map.

Invariant: The snapshot is an independent cut of durable blocks. Unflushed writes are absent from this model after a crash.

Read [master chapter 6](../../GUIDE.md#stage-06) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 06
python3 run.py experiments --stage 06
python3 run.py test --stage 06
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Use the imported storage chapter. Cloud counterpart requires a deliberately provisioned scratch volume; no host disks are used by this lab. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** No device, filesystem, mount, fsync guarantee, partial sector writes or real EBS snapshot is simulated. No privileged operation occurs.
