# AWS from first principles

**Question:** how does a local program become a reachable AWS service with explicit identity, network paths, durable state, deployment controls, and recovery procedures?

Start with the [single master guide](GUIDE.md). It derives AWS service choices from identity, packet paths, durable state, capacity, retries, reconciliation, observation and recovery.

The [20-stage Python lab](aws-service-lab/README.md) contains inspectable implementations, 81 specific exercises, property checks and deliberate failures. The [cloud workbook](CLOUD-LABS.md) compares those mechanisms with real IAM, S3, SQS, DynamoDB, Lambda, SNS, EventBridge and Kinesis operations. [Exercise review and five design challenges](EXERCISES.md) require reasoning about state, boundaries, failures, cost and cleanup.

The original [service-lifecycle curriculum](service-lifecycle/README.md) keeps its six chapters, 18 cloud labs, Python API, container image, CloudFormation examples and inactive CI workflow together. The [import record](service-lifecycle/IMPORT.md) preserves its source revision and dated research context. New material extends that baseline without rewriting the original 23 source files.

## Start here

| Route | Start | Requirements and observable result |
| --- | --- | --- |
| First principles, no AWS account | [Master guide](GUIDE.md), [local lab](aws-service-lab/README.md) | Python 3.10+, no dependencies; observe permission denial, stale writes, redelivery, checkpoint replay, cache races and file-backed recovery |
| Targeted real-service comparisons | [Cloud workbook](CLOUD-LABS.md) | CLI/jq and selected sandbox permissions; compare toy assumptions to actual service responses and collect your own evidence |
| Local only | [Local API lab](service-lifecycle/04-hands-on-labs.md#4--run-and-inspect-the-local-api), [example files](service-lifecycle/examples/README.md) | Python 3; inspect HTTP responses, request IDs, JSON logs, health, and graceful shutdown without an AWS account |
| First cloud exercise | [Getting started](service-lifecycle/00-getting-started.md) | Authorized sandbox identity and AWS CLI v2; create a private bucket, round-trip an object, inspect settings, and clean up |
| Focused storage and messaging | [S3/SQS track](service-lifecycle/04-hands-on-labs.md#focused-s3-and-sqs-track) | CLI, Bash, Python, jq, curl, and sandbox provisioning permissions; observe object versions, queue delivery, and duplicate work |
| Full service lifecycle | [Curriculum index](service-lifecycle/README.md), then [container setup](service-lifecycle/04-hands-on-labs.md#full-container-track-setup-and-change-loop) | Adds Docker/buildx, infrastructure permissions, and a controlled DNS domain for HTTPS; deploy, observe, inject failures, restore, and tear down |

### Local model commands

From this repository's root:

```bash
cd domains/aws/aws-service-lab
python3 run.py demo
python3 run.py experiments
python3 run.py test
python3 run.py demo --stage 12
python3 -B cloud/test_handler.py
python3 -B cloud/build_template.py --check
python3 -B cloud/check_templates.py
```

No AWS APIs or network listeners are used by these checks. SQLite and capstone state use private temporary directories. Model time and illustrative billing rates are explicit inputs, not AWS latency or price measurements. The secrets/key model performs no encryption.

### Cloud lab working directory

From this repository's root:

```bash
cd domains/aws/service-lifecycle
```

The imported guides' **“repository root” means this curriculum directory**. Run `source examples/lab.sh`, `python3 examples/smoke.py`, and `docker build ... examples` from here. Sourcing the helper defines functions; its planning functions make AWS API calls, and applying a reviewed change set changes infrastructure. Follow each lab's existing account, cost, acceptance, and cleanup instructions.

A local acceptance command, with no AWS calls:

```bash
python3 examples/smoke.py
```

This command launches the diagnostic API on localhost and checks its responses, logs, and shutdown. It does not validate deployed infrastructure. The [examples guide](service-lifecycle/examples/README.md) explains the model's limits.

## Read the mechanism, then observe it

The [master curriculum](GUIDE.md) and each [stage walkthrough](aws-service-lab/README.md#progression) add prediction, inspectable transitions, a controlled failure, modification exercises and an AWS counterpart. The table below maps the original deployment/reference material that the new curriculum builds on.

| Chapter | Learning question | Evidence to collect |
| --- | --- | --- |
| [00 — Getting started](service-lifecycle/00-getting-started.md) | Which identity, account, region, and resource did my command actually use? | Caller identity, bucket configuration, matching uploaded/downloaded bytes, cleanup |
| [01 — Foundations](service-lifecycle/01-foundations.md) | Which permission and network boundaries must an operation cross? | Allowed and denied requests; packet paths through routes, security groups, and endpoints |
| [02 — Architecture and services](service-lifecycle/02-architecture-and-services.md) | Who owns scheduling, storage, delivery, and reconciliation? | A service choice justified by workload semantics, failure domains, and a reviewed change set |
| [04 — Hands-on labs](service-lifecycle/04-hands-on-labs.md) | Can I build and inspect the system one dependency at a time? | Local API checks, deployed task revision, target health, DB bootstrap exit, queue duplicates, restore evidence |
| [03 — Operations and reference](service-lifecycle/03-operations-and-reference.md) | Can I identify the failed boundary and recover service? | User-facing signals, diagnosis, recovery procedure, RTO/RPO observations, complete teardown |
| [05 — Sources and currency](service-lifecycle/05-sources-and-currency.md) | Which claim depends on the current service, region, or lifecycle? | Primary documentation, date checked, regional availability, and an explicit correction when guidance changes |

## A service is a chain of boundaries

```text
Human / CI identity → AWS control-plane API → desired resource configuration
                                               │
                                               ▼
Client → DNS / TLS → public ALB → private Fargate process → private PostgreSQL
                                          │
                                          └→ S3 / SQS when granted application permissions

Logs / metrics / alarms → diagnosis → recovery or reviewed replacement
Backups / retained objects → restore test → measured recovery evidence
```

The container labs compose these mechanisms. The focused S3/SQS path can run independently. An application call requires suitable application-role permissions as well as a working network path; creating a resource alone grants neither.

| State | Transition | Invariant to explain | Counterexample to investigate |
| --- | --- | --- | --- |
| Principal, role session, policies | Authenticate, assume a role, authorize a request | Trust and permissions answer different questions | Correct credentials, wrong account; explicit deny; wrong resource ARN |
| Subnets, routes, endpoints, security groups | Forward a connection along its path | A permitted operation still needs a reachable endpoint | Task starts but image pull, logging, or DB connection fails |
| Image digest, task definition, desired tasks | Deploy and replace processes | A healthy target must run the intended revision | Service is stable while old tasks still serve traffic |
| Objects, SQL rows, queue messages | Store, retry, acknowledge, restore | Durable state and repeatable side effects need explicit semantics | Duplicate delivery repeats a side effect; a backup cannot be restored |
| Metrics, alarms, owners, runbooks | Detect and respond | An alarm needs an action and a responsible recipient | CPU alarm exists but nobody receives it; service health is not measured |

These are bounded learning examples. The source explicitly describes one-NAT and initial single-AZ database shortcuts, retained resources, secret rotation omissions, and the diagnostic HTTP server's limits. Use its [promotion gates](service-lifecycle/examples/README.md#learning-shortcuts-and-production-promotion-gates) when evaluating a real service.

## Connect AWS choices to underlying systems

These catalog links include planned topics; they are optional deeper questions, rather than prerequisites for the first AWS exercise.

| AWS question | Underlying topics |
| --- | --- |
| Why can an authorized request still time out? | [IP](../../INDEX.md#ip), [routing](../../INDEX.md#routing), [DNS](../../INDEX.md#dns), [TLS](../../INDEX.md#tls) |
| Why can a queue deliver the same work twice? | [Distributed queues](../../INDEX.md#distributed-queues), [idempotency](../../INDEX.md#idempotency), [failure models](../../INDEX.md#failure-models) |
| What does a database restore establish? | [Transactions](../../INDEX.md#transactions), [database recovery](../../INDEX.md#database-recovery) |
| How do I limit an application's authority? | [Authentication](../../INDEX.md#authentication), [capabilities](../../INDEX.md#capabilities), [threat modeling](../../INDEX.md#threat-modeling) |
| How do I detect and recover a bad deployment? | [Deployment](../../INDEX.md#deployment), [observability](../../INDEX.md#observability), [reliability](../../INDEX.md#reliability) |

## Repository integration

- Canonical catalog topic: `aws-service-lifecycle`, with its [curriculum entry](curriculum/README.md). The master guide and lab stay under `domains/aws/`; the imported source stays at `domains/aws/service-lifecycle/`.
- The original 23 tracked files were copied unchanged from revision `1cc1b8971b2df911bb7f905f24907197ea65fd25`; Git metadata, ignored files, and credentials were excluded.
- The source's documentation research snapshot remains **2026-10-04**. Importing it does not refresh pricing, lifecycle, support, or regional guidance.
- `examples/github-actions.yml.example` remains inactive. Its commands assume the original standalone repository root; see [workflow integration notes](service-lifecycle/IMPORT.md#ci-working-directory) before adapting it to this monorepo.
- Available explanations and lab instructions are recorded as artifacts. Cloud deployment and learner outcomes remain unverified.
- [Experiment evidence](experiments/README.md) records local checks and their limitations; [the source map](references/README.md) links the public service contracts consulted for this extension.
