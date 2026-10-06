# 05 — How do whole-object writes, versions and preconditions change concurrent updates?

**Learner question:** How do whole-object writes, versions and preconditions change concurrent updates?

State: Keys mapped to ordered immutable versions; current delete marker; content comparison token.

Invariant: A stale match token cannot overwrite newer content. A current delete marker hides the key while historical versions remain readable.

Read [master chapter 5](../../GUIDE.md#stage-05) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 05
python3 run.py experiments --stage 05
python3 run.py test --stage 05
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Workbook B; first S3 exercise and original lab 12. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** The local token is SHA-256 of text, not an AWS ETag algorithm. No multipart uploads, replication, bucket configuration delays, lifecycle jobs or atomic multi-key writes.
