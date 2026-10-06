# 13 — How do independent subscribers differ from workers competing for one job?

**Learner question:** How do independent subscribers differ from workers competing for one job?

State: Event ID/source/type; subscriber filters; separate target inboxes; failed target list.

Invariant: Each matching subscriber gets its own copy. Consuming one inbox does not acknowledge another subscriber.

Read [master chapter 13](../../GUIDE.md#stage-13) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 13
python3 run.py experiments --stage 13
python3 run.py test --stage 13
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Read original messaging chapter. Optional cloud extension: SNS→two SQS queues or EventBridge→SQS; explicitly provision permissions and cleanup. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Equality filters only; no SNS/EventBridge delivery implementation, IAM policy, archive, replay, retries or orchestration service. Partial failures are returned for the caller to handle.
