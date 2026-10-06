# 07 — How many workers are needed, and how much capacity survives an AZ failure?

**Learner question:** How many workers are needed, and how much capacity survives an AZ failure?

State: Arrival rate in requests/s; service occupancy in s/request; target utilization; min/max; healthy slots by zone.

Invariant: Expected busy slots are λS. Provisioned slots are bounded ceil(λS/u); surviving capacity must still meet demand.

Read [master chapter 7](../../GUIDE.md#stage-07) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 07
python3 run.py experiments --stage 07
python3 run.py test --stage 07
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original labs 15–16. Model numbers are inputs, not measured AWS throughput. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Steady occupancy approximation with homogeneous slots; no burst distribution, CPU scheduling, ALB fail-open or real autoscaling control loop.
