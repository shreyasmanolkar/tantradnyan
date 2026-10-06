# 04 — Why can DNS be correct while a request reaches an old or unhealthy endpoint?

**Learner question:** Why can DNS be correct while a request reaches an old or unhealthy endpoint?

State: Authoritative name map; cached answer with logical expiry; certificate-name and target-health gates.

Invariant: Changing authority does not rewrite an already cached answer. TLS identity and HTTP application health are separate checks.

Read [master chapter 4](../../GUIDE.md#stage-04) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 04
python3 run.py experiments --stage 04
python3 run.py test --stage 04
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original lab 7. Read CloudFront cache-policy and Route 53 record contracts before adding an edge cache. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** One resolver, fixed logical TTL, exact-name checks, no real DNS/TLS, wildcards, delegation, DNSSEC or CloudFront implementation.
