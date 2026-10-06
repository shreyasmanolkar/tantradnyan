# 02 — Choose services, compose architectures, ship safely

[Index](README.md) · [Foundations](01-foundations.md) · [Labs](04-hands-on-labs.md)

## 1. Compute: who owns the machines and the scheduler?

For a containerized HTTP API, start by comparing **ECS/Fargate** against **Lambda**. Choose EC2 when machine control or utilization economics justify host ownership; EKS when Kubernetes is an actual organizational requirement. This is a learning recommendation, not a universal architecture.

| Choice            | Appropriate workload / avoid when                                                          | Operations, deployment, scaling                                                                        | Cost / constraints                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| EC2               | Custom OS, agents, hardware, long-running or licensed software; avoid for simplicity alone | You patch OS, harden metadata, build AMIs, use Auto Scaling Groups, ALB, SSM; replace unhealthy hosts  | Instance time, disks, IPs, transfer; pay for idle; scaling includes instance boot                                    |
| ECS on EC2        | Containers with predictable utilization or host requirements                               | ECS schedules tasks; you still manage host fleet/capacity providers, AMIs and draining                 | Can pack tasks efficiently; task scaling and fleet scaling are separate                                              |
| ECS/Fargate       | Stateless containers, API/worker services, scheduled jobs                                  | ECS reconciles tasks; AWS owns hosts; task ENIs/roles/logs, rolling or other supported deployments     | Requested vCPU/memory time, storage, networking; startup/image pull delay; no host-level control                     |
| EKS               | Kubernetes ecosystem, portability requirements, existing platform team                     | Managed control plane; still own Kubernetes upgrades/add-ons, policies, workloads and chosen node mode | Cluster/platform plus compute/network; operational learning cost is substantial                                      |
| Lambda            | Bursty event handlers, bounded requests/jobs                                               | Deploy function versions/aliases; concurrency scaling; execution roles; logs and tracing               | Requests/duration and optional provisioned capacity; cold starts, timeout/concurrency limits, DB connection pressure |
| ECS Express Mode  | Faster supported path to container web services                                            | Provisions/configures ECS and supporting resources; inspect what it creates                            | Underlying resource charges and abstraction constraints; learn the primitives before customizing                     |
| Elastic Beanstalk | Teams wanting managed application environments                                             | Platform handles provisioning/deployments; you own code, configuration and platform updates            | Underlying infrastructure; abstraction can complicate unusual topology                                               |
| App Runner        | Existing supported users only                                                              | Do not choose as a new-customer onboarding path                                                        | See verified lifecycle restrictions in [currency notes](05-sources-and-currency.md)                                  |

Stateful applications do not become durable by using containers. Put authoritative state in a database/object store; choose EBS/EFS only for appropriate filesystem semantics. Long-running services fit ECS/EC2; break unbounded Lambda work into queues/workflows or use another runtime. VPC-attached Lambda still needs appropriate egress; a public subnet alone does not grant its function a public IP. [Compute decision guide](https://docs.aws.amazon.com/decision-guides/latest/decision-guides/choosing-aws-container-service.html) · [Lambda VPC access](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc-internet.html).

## 2. Containers: desired state becomes running processes

```text
source + build dependencies → Docker image → ECR digest
                                             ↓
                                  ECS task-definition revision
                                             ↓
                              ECS service desired task count
                                             ↓
                           Fargate tasks with ENI + task role
                                             ↓
                                ALB target health / traffic
```

- **Image:** immutable application filesystem and entrypoint. Build for the intended CPU architecture, run non-root, avoid secrets in layers, scan/rebuild it. **ECR** stores images; configure lifecycle retention, immutable release tags, and scanning. An image digest is the deployment identity; `latest` is not a rollback plan.
- **Cluster:** logical ECS scheduling grouping; a Fargate cluster is not a fleet of VMs you manage. **Task definition:** versioned configuration containing image, CPU/memory, ports, secrets, roles, logging, runtime and health checks. **Task:** one instantiation, potentially multiple related containers. **Service:** controller keeping the desired number running and registering targets.
- **Fargate:** select a supported CPU/memory pair and architecture. `awsvpc` gives each task an ENI/IP; use target type `ip` for ALB. Size subnet IP headroom for deployment surge as well as steady state.
- **Configuration:** ordinary environment values are visible to operators; secret references should contain ARNs, not values. Injection uses the execution role. SDK retrieval uses the task role and can cache/refresh. Injected environment secrets do not automatically change after rotation—replace tasks. [ECS secret injection](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html).
- **Discovery:** ALB is the HTTP entrypoint. Cloud Map or ECS Service Connect MAY provide private service discovery/communication when services multiply; do not add a mesh to a single API. [Service Connect](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-connect.html).
- **Health:** container liveness tests process viability; ALB health controls traffic routing; a separate readiness/synthetic check can exercise dependencies. Avoid restarting every task simply because the shared DB is briefly unavailable. Configure health grace period, deregistration draining, SIGTERM handling and stop timeout together.
- **Scaling:** Application Auto Scaling changes service count using CPU, memory or request/backlog-derived signals. Set min/max, cooldowns, and database connection budgets; autoscaling is not instant. [ECS scaling](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html).
- **Release:** rolling deployment gradually replaces tasks with spare capacity. Enable deployment failure detection/rollback; first-ever deployments have no healthy prior revision. Blue/green, canary and linear approaches can reduce exposure but need traffic tests and extra capacity. Current native options are in the currency notes. Rolling rollback does not undo SQL migrations.

**Troubleshoot in this order:** service events → stopped-task reason → image/architecture → execution-role permissions and egress → application logs → health check path/port → target health. A task can be RUNNING yet unable to serve requests.

## 3. Storage: choose the access model

| Storage          | What/how/when                                                                                                 | Configure and secure                                                                                                             | Cost and failure traps                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| S3               | Durable objects by bucket + key; prefixes are key strings, not directories. Assets, uploads, exports, backups | Block Public Access, bucket-owner-enforced ownership, versioning, encryption, least-privilege bucket/object policies, lifecycle  | GB-month, requests, retrieval, replication, transfer, KMS; versions and incomplete multipart uploads accumulate            |
| EBS              | Block device generally attached to EC2 within an AZ; OS/data disks                                            | Encrypted gp3 or IOPS-oriented volume; provision size/IOPS/throughput, snapshot policy, attachment/delete-on-termination choices | Pay provisioned storage/performance; snapshots incremental but retained blocks cost; an AZ-local volume is not cross-AZ HA |
| EFS              | Managed shared NFS filesystem for multiple Linux clients; shared POSIX-like files, not object access          | Regional versus One Zone choice, mount targets, SG/NFS 2049, access points/POSIX IDs, TLS, backup                                | Storage class, throughput/access costs; metadata/small-file patterns and cross-AZ placement matter                         |
| Database storage | Indexed transactional records and constraints                                                                 | Let RDS/Aurora manage underlying storage; tune queries and capacity                                                              | Do not store every binary upload in SQL or replace transactions with S3 key overwrites                                     |

S3 is not a mounted disk; EBS is not a multi-AZ shared filesystem; EFS is not a database. [S3 concepts](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html) · [EBS volumes](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes.html) · [EFS performance](https://docs.aws.amazon.com/efs/latest/ug/performance.html).

**S3 practical rules:** use presigned URLs for short-lived scoped uploads/downloads after application authorization. They are bearer capabilities—do not log them; expiry is also bounded by signing-credential lifetime. Validate key ownership, file size/type and processing status. Use multipart transfer for large uploads and lifecycle-abort incomplete uploads. Event notifications can duplicate/out-of-order; consumers must be idempotent. Select Standard for frequent access, Intelligent-Tiering for suitable uncertain access, and colder classes only when retrieval latency, minimum duration and retrieval costs fit. Lifecycle SHOULD cover noncurrent versions as well as current objects. Versioning enables recovery but is not immutable backup; Object Lock has stronger retention semantics and operational consequences. Replication needs explicit configuration, versioning, permissions and KMS handling; existing objects may need Batch Replication, and deletion behavior must be understood. Serve static assets through CloudFront with an S3 origin access control, not a public bucket. [Presigning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) · [Lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html) · [Replication scope](https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-what-is-isnot-replicated.html).

## 4. Data services: managed does not mean operator-free

### RDS PostgreSQL/MySQL

RDS owns host replacement, managed backups and supported maintenance mechanisms; you still own schema, indexes, queries, user grants, connection pools, maintenance planning and recovery tests. Choose instance class based on memory/CPU/connection load, storage based on size and I/O, and a supported engine version available in the region. Parameter groups are engine-specific configuration; some changes require reboot. Set private subnet group, DB SG, encryption, backup retention, maintenance window, deletion protection and final snapshot policy. [RDS best practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html).

**Multi-AZ is availability; backups are recovery.** A standard Multi-AZ DB **instance** has a standby that does not serve reads. Read replicas serve reads and normally replicate asynchronously; application routing and lag tolerance matter. RDS Multi-AZ **clusters** are a distinct architecture with readable instances—do not transfer assumptions between them. Failover interrupts connections; reconnect with bounded backoff and fresh endpoint resolution, and never blindly retry non-idempotent commits. [RDS deployment models](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html).

Budget total DB connections as `maximum tasks × pool size + workers + jobs + operator reserve`; include deployment surge. Add a pool/proxy when measured connection churn warrants it; RDS Proxy has workload/transaction behavior and cost trade-offs. Monitor DB load, memory, storage free space, I/O latency, locks, replication lag, and connections. Use CloudWatch Database Insights/current monitoring options, not stale console tutorials. Enable TLS with hostname verification and maintain the RDS CA bundle. [PostgreSQL TLS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL.Concepts.General.SSL.html).

### Aurora

Aurora is PostgreSQL/MySQL-compatible compute over a distributed managed storage architecture, not simply “RDS with a bigger instance.” Writer/readers, storage growth, failover and cluster endpoints differ. Consider it for read scaling, availability requirements, its specific features, or variable demand with supported Serverless v2 configurations; compare compute, I/O or I/O-Optimized, storage and replica costs. Do not assume compatibility means every extension/version behaves identically or that serverless always means zero idle cost. [Aurora overview](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html).

### ElastiCache: Valkey / Redis OSS / Memcached

Use a supported engine deliberately; current Valkey is relevant, not merely historical Redis naming. Cache-aside: read cache → miss → database → store with TTL/jitter. Choose serverless or node-based operation, TLS/auth, private access and required replica/failover behavior. Caches help hot repeated reads, sessions, ephemeral rate counters; memory, serverless processing, replicas and network drive cost. Protect against stampedes, oversized values, eviction and stale authorization data. Treat authoritative sessions carefully during cache loss. Distributed locks need owner tokens, expiry and often fencing; a cache failover can invalidate simplistic exclusivity assumptions. Avoid caching until you can state the consistency/invalidation policy. [ElastiCache guide](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/WhatIs.html).

### DynamoDB

Use when key-oriented access patterns and scalable low-latency operations fit. Partition key hashes distribute work; sort key orders items within that key. Example: `PK=TENANT#123`, `SK=ORDER#2026-...`; a tenant with disproportionate traffic can become hot, so model actual skew. Query known keys; a Scan is not a substitute for designing access paths. GSIs provide alternate partition/sort keys and add write/storage cost; LSIs have creation and collection-size constraints. On-demand simplifies capacity purchasing; provisioned capacity/autoscaling fits predictable use. Neither eliminates throttling or hot-key risks. [DynamoDB core concepts](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html).

Reads default to eventual consistency; supported table/LSI reads can request strong consistency; GSIs do not support strongly consistent reads. Global-table consistency depends on the configured mode and availability; verify current regional support. Use conditional writes for optimistic concurrency and transactions when needed. Avoid DynamoDB for an evolving relational domain requiring joins/ad hoc queries unless the denormalization and access-pattern constraints are intentional. [Read consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html).

## 5. Messaging: who keeps the work and who receives it?

| Primitive             | Use                                                              | Configure / cost / operational hazard                                                                      |
| --------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| SQS queue             | Competing workers process durable jobs                           | Visibility, long poll, retention, DLQ, encryption, role permissions; billed requests/payload and transfer  |
| SNS pub/sub           | Fan-out one notification to subscribers                          | Topic/subscription policy, delivery retries, filter policies; pair with one SQS queue per durable consumer |
| EventBridge event bus | Route domain/integration events by content to targets            | Rules, event schema/version, permissions, target retry/DLQ; match failures and targets need monitoring     |
| Kinesis Data Streams  | Partitioned retained stream for replay and independent consumers | Partition-key balance, retention, throughput mode/consumers; ordering is per shard, not global             |

Example: API commits order + outbox row → relay publishes `OrderPlaced` → EventBridge routes to fulfillment SQS and analytics → workers process independently. The **transactional outbox** prevents “DB committed, event publish failed” gaps. SNS→multiple queues is simpler when only fan-out is needed. A queue is not automatically a replayable event log. [Messaging decision guide](https://docs.aws.amazon.com/decision-guides/latest/sns-or-sqs-or-eventbridge/sns-or-sqs-or-eventbridge.html).

SQS receive hides a message for its visibility timeout; it does not delete it. Worker MUST commit its side effect then delete using the receipt handle. Crash after commit/before delete produces replay: use a durable business idempotency key. Long polling reduces empty receives. Set timeout above usual processing duration and extend visibility for long tasks; cap retries and send poison messages to a DLQ with longer retention. Alarm on DLQ count and oldest message age; redrive only after fixing the cause. FIFO orders within a message group and deduplicates sends within defined semantics; it does not make external side effects exactly-once. More groups permit parallelism. [SQS visibility](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html) · [FIFO delivery](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html).

## 6. Edge and API composition

| Pattern                                     | Choose for                                              | Avoid / verify                                                                                              |
| ------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Route 53 → ALB → ECS                        | Straightforward regional HTTP container service         | ALB fixed floor; app owns API auth/quotas/schema policies                                                   |
| CloudFront + WAF → ALB → ECS                | Global edge, static/cacheable responses, edge filtering | Configure cache keys/cookies/Authorization deliberately; never cache one user's private response for others |
| API Gateway → Lambda                        | Managed API front door with event compute               | HTTP vs REST API feature/price differences, timeouts, payload and concurrency quotas                        |
| API Gateway → VPC link → internal ALB → ECS | Managed API features with private container backend     | Added cost/hop; private integration is not private client access; choose supported link/API type            |
| CloudFront → private S3 origin              | Static assets/downloads                                 | Use origin access control, HTTPS and application-specific signed access where needed                        |

Route 53 is DNS. ACM issues/manages certificates. ALB terminates HTTP(S) and routes targets. API Gateway is an API front door with API-type-specific authorization/traffic features. WAF inspects supported HTTP entrypoints; it is not a VPC firewall. CloudFront is a global edge distribution with independent viewer and origin TLS connections.

ALB certificate lives in the ALB region; CloudFront viewer ACM certificate must be in `us-east-1`. Keep DNS validation records for renewal. Prevent bypass of CloudFront/WAF by protecting the origin: supported private VPC origin or appropriately restricted public origin with origin verification. Choose policies to match the integration; merely adding a secret header is not network isolation. [CloudFront TLS](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html) · [API Gateway private integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/private-integration.html).

## 7. Three progressively richer architectures

### A — Simple production API

```text
Route 53 alias → HTTPS ALB [AZ A, B]
                     → private Fargate tasks [AZ A, B]
                          → private RDS PostgreSQL Multi-AZ
ECR → ECS release; Secrets Manager → task; logs/metrics → CloudWatch
```

ALB provides stable ingress and health routing; tasks provide replaceable compute; RDS holds state. Task role limits AWS data access; DB role limits SQL; SG chain is ALB→task→DB. Deploy two tasks across AZs and sufficient egress redundancy. Backups, TLS, alarms, CI and ownership are part of production even though omitted from the short request path. Failure modes: bad release, DB failover, shared secret/DNS/egress failure. Cost floor: ALB, tasks, RDS, NAT/endpoints and logs. Simplify to one task/single-AZ DB only when explicitly accepting downtime (sandbox or low-criticality design), not while claiming AZ resilience.

### B — Scalable API

```text
Route 53 → CloudFront/WAF → ALB → Fargate autoscaling → RDS
                                    ├→ Valkey cache
                                    ├→ private S3 (presigned file transfers)
                                    └→ SQS → independently scaled workers → RDS/S3
```

CDN reduces repeat downloads; cache reduces expensive repeated reads; queues decouple bursty work; S3 removes file bodies from the API path. Separate API/worker roles and SGs. Failure modes: stale caches, cache stampede, queue backlog, duplicate processing, DB saturation despite more tasks. Monitor hit ratio, queue age, job success and end-to-end latency, not just CPU. Costs add edge requests/transfer, cache memory, worker compute and queue operations. Remove cache/CDN/event layers unless measurements or security requirements justify them.

### C — Availability and recoverability

```text
Primary region: A or B, spread across AZs + resilient egress + DB failover
    ├→ centralized audit/security account
    ├→ alarms + synthetic probes + tracing + on-call response
    ├→ protected cross-account backups / tested restore manifests
    └→ second region: artifacts + keys + backups; optional warm compute/data replica
CI: OIDC → review → migrations → staged release → health gates → rollback
```

An AZ outage is handled locally; a regional disaster follows an explicit recovery runbook, not magic DNS failover. Replicate/copy required data, images, configuration, certificates and usable encryption keys; pre-check recovery quotas. Choose backup/restore, pilot light or warm standby based on RTO/RPO. Active/active adds conflict resolution and operational complexity; it is not the default next step. Cost drivers are redundancy, retained copies, replication and drills. Simplify multi-region runtime when tested backup/restore meets business needs. [DR strategies](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html).

## 8. IaC and delivery: review the actual change

| Tool           | Useful when                                                         | State / trade-off                                                                                                                 |
| -------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| CloudFormation | AWS-native explicit resources and managed stack lifecycle           | AWS stores stack state; change sets/rollback; service coverage and replacement semantics matter                                   |
| AWS CDK        | TypeScript/Python abstractions and reusable constructs              | Synthesizes CloudFormation; understand generated resources, bootstrap roles, context and updates                                  |
| Terraform      | Multi-provider graph and existing team ecosystem                    | Protect remote state/locking and provider locks; plan output can include sensitive material; recovery is not a universal rollback |
| Pulumi         | General-purpose-language infrastructure and suitable team practices | Protect state backend/config secrets/provider versions; preview and runtime-language complexity                                   |

Learn CloudFormation resource relationships in these labs, then choose the team's long-term tool. Never let two engines own the same resource. Separate environments/accounts and state; do not use a variable named `env` as your only isolation control. Modules/stacks establish ownership seams. References express dependencies; explicit dependencies handle ordering not visible in values. Drift means reality differs from declared state: investigate before reconciling. Review replacement flags, deletion policies and stateful resource changes. Encrypt/version state, restrict access, serialize writes and rehearse state recovery. Marking a Terraform value sensitive hides output; it does not necessarily remove the value from state. [CloudFormation change sets](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html) · [Terraform state security](https://developer.hashicorp.com/terraform/language/state/sensitive-data) · [CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html) · [Pulumi state](https://www.pulumi.com/docs/iac/concepts/state-and-backends/).

**Release pipeline:** test → build image once → scan → push ECR → resolve digest → review IaC change set → run compatible migration once → deploy task revision → wait for service convergence → smoke/synthetic checks → observe SLO → promote same digest. Use protected CI environments, OIDC role per account, and narrowly scoped `iam:PassRole`. Roll back application digest if safe; use expand/migrate/contract database changes so old/new code can coexist. Do not run schema migrations concurrently in every starting API task. [ECS deployment best practices](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html).

Ordinary config belongs in versioned deployment settings or Parameter Store. Credentials belong in Secrets Manager or another approved secret store. Rotation requires both credential replacement and consumer refresh; test it under live connections. IaC SHOULD pass secret references, not secret plaintext, through plans, outputs, logs or Git. Deploy identities should be able to reference a runtime secret without necessarily reading its value.
