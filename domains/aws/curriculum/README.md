# AWS services: curriculum entry

**Question:** how does a local program become an authorized, reachable, durable and recoverable service, and what mechanisms do AWS products supply?

Read the [domain overview](../README.md) and [single master guide](../GUIDE.md). The [20-stage Python lab](../aws-service-lab/README.md) exposes state transitions and failures; its walkthroughs contain 81 exercises. The [cloud workbook](../CLOUD-LABS.md) adds real-service comparisons, while the original [18 cloud labs](../service-lifecycle/04-hands-on-labs.md) build an operated container service.

```bash
cd domains/aws/aws-service-lab
python3 run.py demo
python3 run.py experiments
python3 run.py test
```

Python 3.10+, standard library only for local models; no AWS account required. Cloud exercises require their documented authorized sandbox, tools, permissions, reviewed provisioning and cleanup. Check [evidence](../experiments/README.md) and [model/contract differences](../references/README.md) before interpreting a successful run.

This page retains catalog topic ID `aws-service-lifecycle`. The original imported tree stays intact under `domains/aws/service-lifecycle/`; its [provenance](../service-lifecycle/IMPORT.md) and file hashes remain the historical import baseline.
