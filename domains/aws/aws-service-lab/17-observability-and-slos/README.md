# 17 — Which missing or aggregated data makes a healthy-looking dashboard misleading?

**Learner question:** Which missing or aggregated data makes a healthy-looking dashboard misleading?

State: Finite metric windows; M-of-N threshold; missing-data policy; request success count; nearest-rank latency quantile.

Invariant: The alarm decision explicitly depends on missing-data policy. Error budget compares failed requests with allowed failures over one defined population/window.

Read [master chapter 17](../../GUIDE.md#stage-17) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 17
python3 run.py experiments --stage 17
python3 run.py test --stage 17
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original lab 10. Actual CloudWatch missing-data evaluation has additional evaluation-range behavior beyond this toy window. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Finite lists and nearest-rank percentile, no CloudWatch backend, histogram accuracy, time-series ingestion delay or real SLO measurements.
