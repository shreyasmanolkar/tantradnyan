# 03 — Why does permitting destination port 443 still allow a connection to time out?

**Learner question:** Why does permitting destination port 443 still allow a connection to time out?

State: IPv4 route prefixes; ordered ACL rules; destination and ephemeral source ports; SG/listener gates.

Invariant: The most specific matching route wins. ACL evaluation stops at its first matching rule. A connection needs both request and return paths.

Read [master chapter 3](../../GUIDE.md#stage-03) and the [walkthrough](GUIDE.md). Run from `domains/aws/aws-service-lab` with Python 3.10+:

```bash
python3 run.py demo --stage 03
python3 run.py experiments --stage 03
python3 run.py test --stage 03
```

Inspect [model](src/model.py), [demo](src/demo.py), [checks](tests/test_model.py), and [failure experiment](experiments/README.md).

AWS counterpart: Original labs 3, 6 and 8. Read routes and SGs before changing an AWS path. See the [cloud workbook](../../CLOUD-LABS.md).

**Limits:** IPv4, one synthetic flow and no real packets. NAT address translation, ENIs, SG references, connection-tracking limits and managed-service DNS are not implemented.
