# 08 — Why can a service have free CPU, pending tasks and an unsafe rollout?

**Learner question:** Why can a service have free CPU, pending tasks and an unsafe rollout?

State: Task CPU/memory requests; host capacities; pending assignments; image digest and health.

Invariant: Every placement respects both resource dimensions. A rollout gate requires healthy tasks on the intended digest.

Read [master chapter 8](../../GUIDE.md#stage-08) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 08
python3 run.py experiments --stage 08
python3 run.py test --stage 08
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original labs 5–6, 9 and 11. EKS adds Kubernetes objects/controllers; it does not remove resource or identity reasoning. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Bin packing and cutover predicate only; no ECS/Fargate/EKS scheduler, AZ placement, task startup or real load balancer.
