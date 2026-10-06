# Learn AWS by building and operating services

This repository is a practical AWS learning path. Start with a small S3 exercise, then learn the ideas behind AWS accounts, IAM, networking, compute, storage, databases, queues, monitoring, and delivery. The later labs assemble those pieces into a private container service and teach you to inspect, recover, and remove it.

You can follow the first lab with an AWS sandbox account and AWS CLI. Docker and broader deployment permissions are only needed for the later container labs. No application from another project is required.

## Start here

1. Follow [00 — Getting started](00-getting-started.md) to check your tools and AWS identity, then create, use, and delete a private S3 bucket.
2. Read [01 — Foundations](01-foundations.md) for accounts, IAM, and networking.
3. Use [02 — Architecture and services](02-architecture-and-services.md) as a map of common AWS choices.
4. Choose a track in [04 — Hands-on labs](04-hands-on-labs.md): the standalone S3/SQS path for focused service practice, or the longer VPC → ECR → ECS/Fargate → HTTPS → PostgreSQL path.
5. Keep [03 — Operations and reference](03-operations-and-reference.md) nearby while debugging and cleaning up.
6. Check [05 — Sources and currency](05-sources-and-currency.md) before relying on service lifecycle or pricing details.

| Path | What you will practice | Requirements |
| --- | --- | --- |
| First S3 lab | AWS CLI identity, region, bucket security, upload, download, and cleanup | Sandbox account, AWS CLI v2, authorized S3 access |
| S3 and SQS labs | Object storage, presigned downloads, message visibility, retries, and dead-letter queues | Sandbox account, AWS CLI v2, Python 3, `jq`, `curl`, CloudFormation permissions |
| Container service labs | VPCs, IAM roles, ECR, ECS/Fargate, load balancing, HTTPS, PostgreSQL, alarms, and recovery | Dedicated sandbox, Docker, broader reviewed deployment permissions, and a budget |

The advanced labs can create resources that keep billing while idle, including NAT gateways, load balancers, databases, caches, and retained storage. Read each lab's cost and cleanup notes before applying a CloudFormation change set. A budget sends alerts; it does not stop spending. Use synthetic data and a dedicated sandbox account, never production.

## What is in this repository

- `00-getting-started.md` — setup and a small first AWS exercise.
- `01-foundations.md`, `02-architecture-and-services.md`, `03-operations-and-reference.md` — concepts and operating practices.
- `04-hands-on-labs.md` — cumulative labs and teardown instructions.
- `05-sources-and-currency.md` — official references and a process for checking current service guidance.
- `examples/` — local Python service, Docker image, CloudFormation templates, and optional GitHub Actions example.

The examples are learning material, not production-ready application infrastructure. Their limitations and production promotion gates are documented in [examples/README.md](examples/README.md). No AWS resources are created by reading the guides or sourcing `examples/lab.sh`; deployment happens only when you deliberately execute a reviewed change set.

## Learning conventions

- **AWS best practice** refers to a recommendation supported by linked AWS guidance.
- **Engineering practice** refers to an application or operations judgment, such as idempotency and bounded retries.
- **Context / trade-off** depends on the workload, account, region, skills, or budget.
- **Legacy / lifecycle** marks guidance that may be superseded or subject to a service transition; check the currency notes.
- **MUST / SHOULD / MAY / AVOID** apply to the design being discussed, not to every AWS workload.

The material distinguishes commands you can run locally from acceptance checks that require your own AWS account. It does not claim that the cloud labs have already been deployed or verified in your account.
