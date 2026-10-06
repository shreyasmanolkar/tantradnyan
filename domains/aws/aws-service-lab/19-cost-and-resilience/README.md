# 19 — Why can two AZs still share one point of failure and one recurring bill?

**Learner question:** Why can two AZs still share one point of failure and one recurring bill?

State: Quoted billing units/rates; required dependency paths; failed-domain set; snapshot and accepted operation IDs.

Invariant: A viable path has every required dependency available. A restored cut only contains operations included in that cut.

Read [master chapter 19](../../GUIDE.md#stage-19) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 19
python3 run.py experiments --stage 19
python3 run.py test --stage 19
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original labs 15–18 and operations cost/recovery sections. Use current regional pricing; local numerical rates are illustrative only. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** Boolean path model and deterministic accepted-ID sets; no measured probabilities, AWS outage model, price quote or RTO/RPO measurements.
