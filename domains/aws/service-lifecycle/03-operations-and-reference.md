# Operate, recover, troubleshoot, and review

Companion to the AWS field guide. Official documentation checked **2026-10-04**. **AWS** means current AWS guidance or documented behavior; **Practice** means general production engineering; **Trade-off** requires workload-specific judgment. Commands are examples to run yourself, not evidence that infrastructure was deployed.

## Operability: measure user outcomes first

**Practice:** An SLI measures behavior; an SLO sets its acceptable level over a window; an error budget is the allowed failure. Example, not a universal target: 99.9% of valid API requests succeed over 30 days, and 99% finish within 500 ms. Define treatment of timeouts, legitimate 4xx responses, maintenance, and low traffic explicitly. Page on rapid budget consumption; ticket slow degradation. CPU alone is not a customer SLO. CloudWatch Application Signals supports request- and period-based SLOs. [AWS SLOs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-ServiceLevelObjectives.html)

| Signal     | Question answered                                 | Configuration and operational consequence                                                                                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logs       | What happened in this request/task?               | Emit JSON to stdout; ECS `awslogs` sends it to a pre-created CloudWatch log group. Include timestamp, severity, request/trace ID, route template, status, duration, deployment version. Set retention. Never log tokens, passwords, or full sensitive payloads.                                                                             |
| Metrics    | How often/how much, over time?                    | CloudWatch namespaces contain metric names and dimension sets. Use low-cardinality dimensions such as service/environment, not customer ID or request ID. Choose Sum for counts, percentiles for latency, Minimum for availability headroom.                                                                                                |
| Traces     | Where did time/failure occur across dependencies? | Instrument using OpenTelemetry/ADOT and evaluate Application Signals; propagate trace context through HTTP and jobs. Sampling trades forensic completeness for cost. Check runtime/platform support. [Application Signals setup](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Application-Signals-Enable.html) |
| Audit logs | Who changed/accessed AWS resources?               | CloudTrail records AWS activity, not application request logs. Establish durable organization trails; select paid data events deliberately. Event history alone is not your long-term audit archive. [CloudTrail](https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html)                                    |

**Minimum dashboard and alarms** — thresholds below are decisions to derive from a load test and service objectives, not AWS defaults:

| Layer                 | Metrics/events                                                                                                                                              | Actionable alarm                                                                                                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| User/API              | External synthetic probe; application success/latency SLIs; ALB `RequestCount`, `TargetResponseTime`, `HTTPCode_Target_5XX_Count`, `HTTPCode_ELB_5XX_Count` | User failures or latency consume budget; probe fails across consecutive observations. ALB target latency excludes portions of end-to-end latency. Monitor ALB-generated errors separately: `RequestCount` excludes requests for which ALB never selected a target. |
| Targets/ECS           | `HealthyHostCount`, service CPU/memory, desired versus running tasks, stopped-task reasons, deployment events                                               | Healthy capacity below required redundancy; persistent task deficit; deployment failure; memory nearing measured safe headroom. Service averages can hide one hot task. Enable Container Insights when task-level detail warrants its cost.                        |
| RDS                   | `CPUUtilization`, `FreeableMemory`, `FreeStorageSpace`, `DatabaseConnections`, read/write latency and IOPS, replica lag where applicable                    | Connections approach the reserved pool budget; storage has insufficient growth runway; sustained latency/replication lag violates objectives. Correlate with SQL waits, locks, slow queries, and transactions.                                                     |
| SQS                   | `ApproximateAgeOfOldestMessage`, visible/not-visible messages; DLQ visible count; application completed/failed jobs                                         | Oldest work exceeds job SLA; DLQ receives work; backlog grows while completions flatten. Approximate metrics and poison-message behavior mean age alone is insufficient.                                                                                           |
| Changes/security/cost | Failed deployments, unusual privileged activity, threat findings, budget/anomaly notifications                                                              | Route to a named owner with severity and runbook; test delivery and acknowledgment. Cost data is delayed, not a real-time kill switch.                                                                                                                             |

AWS references: [ALB metrics](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html), [RDS metrics](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-metrics.html), [SQS metric semantics](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-available-cloudwatch-metrics.html).

CloudWatch Logs Insights example for JSON logs (select the service log group and a short time range):

```sql
fields @timestamp, request_id, route, status, duration_ms
| filter status >= 500
| stats count(*) as failures, pct(duration_ms, 95) as p95_ms by route, bin(5m)
| sort failures desc
```

Configure alarm missing-data behavior explicitly: missing request counts during idle periods differ from missing heartbeat metrics. Every page SHOULD identify impact, a graph, last deployment, immediate mitigation, and escalation owner.

## Reliability and scaling

**Practice:** A replacement container is not recovery if it reconnects to the same saturated database. Set connection and request deadlines, bounded concurrency, exponential retry backoff with jitter, and a retry budget. Retry only safe/idempotent operations. A database timeout after commit is an unknown outcome: use an idempotency key, not a blind duplicate payment.

| Failure                       | Expected mechanism                                                                       | Your responsibility                                                                                                                   |
| ----------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Container/EC2 host            | ECS replaces service tasks; EC2 Auto Scaling replaces unhealthy instances                | Preserve state externally; make startup reliable; drain requests on SIGTERM; distinguish liveness from readiness.                     |
| Availability Zone             | Healthy targets in other AZs serve traffic; appropriately configured database fails over | Spread compute and dependencies across AZs; reserve enough surviving capacity; check egress paths and connection retries.             |
| Database primary              | Multi-AZ deployment performs failover                                                    | Connections break; reconnect using the endpoint, not cached IPs; resolve transaction ambiguity; test driver DNS behavior.             |
| Dependency/service disruption | Queues buffer work; timeouts and circuit breakers bound impact                           | Shed load, disable optional features, cap queue age, and avoid retry storms. Cached reads may be acceptable; invented success is not. |
| Region                        | Regional HA alone does not recover it                                                    | Execute a tested DR plan, including data ownership, dependencies, credentials, DNS, and failback.                                     |

For growth from **10 → 1,000 → much higher requests/second**, treat numbers as test scenarios, not instance capacities:

1. Benchmark representative reads/writes, payload sizes, burstiness, and downstream calls. Record p95/p99, saturation, and cost per successful request.
2. Make API instances stateless; move uploads to S3, sessions to a deliberate external store, and slow work to SQS workers.
3. Scale tasks horizontally on CPU or measured requests per target; scale workers on backlog per worker/processing time. Define minimum, maximum, cooldowns, startup time, and account quota headroom. ECS Service Auto Scaling uses Application Auto Scaling. [AWS scaling behavior](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html)
4. Bound total DB connections: `maximum task count × pool size + workers + migrations + admin reserve` must fit capacity. Improve SQL/indexes before indiscriminately adding replicas or cache.
5. Scale database compute/storage where measured; replicas serve eligible reads, not primary writes, and introduce lag. Add cache only with an invalidation/staleness contract. CDN caching MUST respect authorization and cache keys.
6. Partition or change data models only after measuring the remaining bottleneck. Load-test loss of an AZ and deployment overlap, not just normal steady state.

**Trade-off:** Extra replicas buy headroom and availability; they impose steady cost. Scale-to-zero saves idle cost but adds startup latency and may not suit an always-available API.

## Recovery is a rehearsed procedure

**RPO** is tolerable lost data, **RTO** tolerable restoration time. Multi-AZ addresses infrastructure availability; replication can faithfully copy accidental deletion. Backups address recoverable history. Neither proves that the application can actually resume.

| Strategy       | What exists before disaster                                              | Trade-off                                                                                                      |
| -------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Backup/restore | Restorable backups plus IaC/artifacts                                    | Lowest idle footprint; provisioning and restore extend RTO.                                                    |
| Pilot light    | Core data/services replicated, remaining application capacity absent/off | Faster than rebuilding everything; must provision/start components before traffic.                             |
| Warm standby   | Complete functioning secondary at smaller capacity                       | Can serve limited traffic immediately; must scale and validate capacity.                                       |
| Active/active  | Multiple Regions serve live traffic                                      | Higher cost and operational burden; conflict resolution, writes, consistency, and split-brain dominate design. |

These are architectures, not guaranteed recovery timings. Measure your own RTO/RPO with production-sized data. [AWS disaster-recovery guidance](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_disaster_recovery.html)

**PostgreSQL restore drill (Practice + documented RDS behavior):**

1. Confirm recovery authorization, incident time, latest restorable time, and destination account/Region. Stop/fence writers when required; preserve evidence.
2. Restore to a **new** isolated instance with explicit subnet group and SG. RDS point-in-time restore does not rewind the existing DB.
3. Wait for availability; verify encryption/KMS access, engine/parameters, credentials, TLS, extensions, row counts, and business invariants. Test against a non-production application instance.
4. Restore related S3 object versions/events as required; replay only idempotent work. Database recovery does not atomically rewind all services.
5. Update the application secret/endpoint through a reviewed rollout; confirm reads/writes and user SLIs. Record actual lost work and elapsed time.
6. Retain old state for investigation and rollback; arrange cleanup after acceptance. Reconcile the restored resource with IaC before later applies. Test failback separately.

```bash
# Variables: source DB ID, unique destination ID, subnet-group name, SG ID.
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier "$DB_ID" \
  --target-db-instance-identifier "$RESTORE_ID" \
  --use-latest-restorable-time \
  --db-subnet-group-name "$DB_SUBNET_GROUP" \
  --vpc-security-group-ids "$DB_SG_ID" \
  --no-publicly-accessible
aws rds wait db-instance-available --db-instance-identifier "$RESTORE_ID"
```

This creates billable infrastructure. For an incident use `--restore-time` instead of latest when recovering before corruption. [RDS PITR prerequisites and behavior](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html)

Protect backups from workload-account compromise using separated access and appropriate cross-account/cross-Region copies; verify destination KMS permissions. Maintain offline recovery instructions and access recovery paths. **MUST:** restore regularly, not merely check that a backup job is green.

## Cost: understand the bill's dimensions

Monthly estimate = provisioned time + requests/processing + stored data + transferred data + observability/security/support. Select Region and actual architecture in the [AWS Pricing Calculator](https://calculator.aws/). No fixed prices are quoted because Region, platform, tiers, and purchasing models change.

| Cost driver               | Typical surprise                                                               | Control and current pricing reference                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fargate/EC2               | Idle replicas and oversized memory; deployment overlap                         | Right-size from measurements. Fargate charges requested resources over runtime, not observed utilization. [Fargate](https://aws.amazon.com/fargate/pricing/)                            |
| NAT/public IPv4/endpoints | NAT hours plus processed data; addresses and endpoint AZ-hours; cross-AZ paths | Compare actual egress with endpoint cost. Use S3/DynamoDB gateway endpoints where applicable; do not assume every endpoint is free. [VPC](https://aws.amazon.com/vpc/pricing/)          |
| ALB                       | Load balancer hourly baseline even when idle, plus capacity units              | Consolidate only when isolation and blast radius permit. Connections, bytes, and rule evaluations affect capacity charging. [ELB](https://aws.amazon.com/elasticloadbalancing/pricing/) |
| RDS                       | Standbys, replicas, storage/IOPS, retained snapshots, extended support         | Estimate complete topology; clean snapshots deliberately; plan upgrades. [RDS PostgreSQL](https://aws.amazon.com/rds/postgresql/pricing/)                                               |
| S3                        | Old versions, requests, retrieval, early-deletion charges, replication         | Lifecycle policies must include noncurrent versions and abandoned multipart uploads. Model retrieval before choosing archive classes. [S3](https://aws.amazon.com/s3/pricing/)          |
| Observability             | Verbose logs, high-cardinality custom metrics, scans, trace ingestion          | Set retention/sampling; narrow Logs Insights time ranges; enable detail where useful. [CloudWatch](https://aws.amazon.com/cloudwatch/pricing/)                                          |
| Transfer                  | Internet, cross-Region, and chargeable cross-AZ traffic                        | Draw data movement, not just services; check each service's transfer rules. Cache assets and avoid needless cross-AZ egress.                                                            |

On-demand buys flexibility. **Trade-off:** Savings Plans exchange eligible usage commitments for discounts; compare current plan eligibility and terms before buying. Service-specific reservations have different coverage. Commit only after measuring a durable baseline. Spot suits interruptible, retryable capacity with graceful shutdown; avoid treating it as guaranteed sole capacity. [Current Savings Plans](https://aws.amazon.com/savingsplans/)

**Cost review checklist:**

- [ ] Owner/environment tags, account budgets, anomaly notifications, and a named reviewer exist.
- [ ] Review cost by service, Region, usage type, account, and tag; compare unit economics, not only totals.
- [ ] Check idle NATs, load balancers, endpoints, public IPv4, unattached volumes, snapshots, replicas, and development stacks.
- [ ] Model inter-AZ/Region/internet transfer, logs, backups, KMS/security features, and support.
- [ ] Review autoscaling maximums and quotas; clean lab resources and retained data intentionally.
- [ ] Treat budgets as alerts unless explicit actions are configured; billing latency prevents a guaranteed spend ceiling. [Cost Anomaly Detection](https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html)

## Troubleshooting: follow the failed boundary

**Practice:** Establish impact/time/account/Region → correlate last change → reproduce one request with an ID → test DNS, TLS, listener, target, process, dependency in order → mitigate → verify → prevent recurrence. Preserve logs before replacing resources. A timeout suggests reachability or saturation; immediate refusal suggests no listener; HTTP errors mean some HTTP endpoint answered.

In the table, AWS CLI commands use the variables defined below. Run internal probes from an approved diagnostic task or ECS Exec session with equivalent networking; a laptop cannot test a private DB path directly. Reachability Analyzer checks supported network configuration paths; it does not prove application health. VPC Flow Logs show accepted/rejected flows, not HTTP payloads.

| Symptoms                    | Likely causes                                                               | Investigation / command or tool                                                                                  | Resolution → prevention                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| DNS NXDOMAIN/wrong endpoint | Wrong zone/delegation, stale record, private zone                           | `dig +trace "$API_HOST"`; `dig "$API_HOST"`; inspect Route 53 records and registrar NS                           | Fix delegation/alias → manage DNS in IaC; monitor externally.                                                                        |
| Connection timeout          | Wrong route, SG/NACL, listener, public/private mismatch                     | `curl -v --connect-timeout 5 "https://$API_HOST/healthz"`; route/SG inspection; Reachability Analyzer; Flow Logs | Repair only required path/port → graph public ALB/private task/private DB boundaries.                                                |
| HTTPS name/chain failure    | Wrong hostname/certificate/Region, validation or expiry                     | `openssl s_client -connect "$API_HOST:443" -servername "$API_HOST" </dev/null`; ACM status                       | Attach correct validated cert → preserve renewal validation records and expiry alarms; never normalize `curl -k`.                    |
| ALB 502                     | Target reset, malformed response, backend TLS/protocol mismatch             | ALB access logs, task logs, target response and connection errors; `describe-target-health`                      | Fix process/protocol/keepalive mismatch → drain connections and align timeouts.                                                      |
| ALB 503                     | No registered/usable targets, wrong listener rule/group                     | Target-health command; ECS events; listener rules                                                                | Restore service/registration → alarm capacity. Do not assume all-unhealthy means 503: ALB can fail open to unhealthy targets.        |
| ECS restarts                | Crash, OOM, health check failure, essential container exit                  | `describe-tasks` stopped reason/container exit; logs; memory; service events                                     | Fix startup/resource/health path → test task-definition health checks, grace period, and shutdown.                                   |
| Image cannot pull           | Missing tag/digest; execution-role denial; ECR/S3 reachability/DNS          | Stopped task error; ECR `describe-images`; execution role; NAT/endpoints                                         | Correct image/permissions/network → deploy immutable digests; verify private image-pull dependencies.                                |
| App cannot reach RDS        | DB SG source/port, wrong endpoint, TLS/auth mismatch                        | From task: `nc -vz "$DB_HOST" 5432`; DB/client logs; DNS, SG, connection configuration                           | Fix task-SG→DB-SG rule or TLS/credentials → never open DB to internet to debug.                                                      |
| IAM AccessDenied            | Wrong principal/resource/action; explicit deny; missing trust; SCP/boundary | `sts get-caller-identity`; exact failed API/ARN; CloudTrail; IAM policy simulator as supporting evidence         | Fix narrow missing grant or applicable deny → validate policies and role assumptions; simulator is not complete cross-service proof. |
| S3 AccessDenied             | Bucket vs object ARN; endpoint/bucket policy; KMS; wrong owner/key          | `s3api head-object`; principal check; enhanced denial message; policy/KMS review                                 | Grant exact required access → test SSE-KMS and cross-account paths, never disable public-access protection reflexively.              |
| DB connection exhaustion    | Pool multiplied by task count, leaks, slow transactions                     | `DatabaseConnections`; pool telemetry; PostgreSQL `pg_stat_activity` and wait events                             | Cap pools/concurrency, fix leaks/queries; assess RDS Proxy → budget connections across peak deployment capacity.                     |
| High CPU                    | Expensive code/query, traffic burst, retry loop                             | Per-task CPU; profiler; trace; request mix; DB waits                                                             | Fix hotspot; scale measured tier → load-test representative traffic.                                                                 |
| High latency, CPU normal    | DB locks, remote dependency, connection starvation, DNS                     | Distributed trace; ALB access timing; pool wait; `pg_stat_activity`                                              | Bound waits/fix bottleneck → separate dependency timeouts and saturation alerts.                                                     |
| Memory exhaustion           | Leak, unbounded queue/cache, oversized payload                              | Stopped reason; memory trend; heap profile in safe replica                                                       | Bound memory/stream data/fix leak; resize if justified → test sustained workload, not only bursts.                                   |
| Queue backlog               | Failed/slow workers, poison jobs, dependency throttling                     | Age + visible/not-visible + DLQ + completion rate; worker logs                                                   | Fix workers, scale within downstream capacity; isolate poison jobs → bounded retry/idempotency and controlled redrive.               |
| Deployment failed           | Bad image, secret permission, health checks, quota/capacity, migration      | ECS events, stopped tasks; CI logs; CloudFormation events                                                        | Roll back image/config when schema compatible → deployment circuit breaker/alarms; expand-contract migrations.                       |
| Bill suddenly increases     | Traffic/abuse, debug logs, leaked resources, transfer                       | Cost Explorer by usage type/Region/tag; anomaly details; deployment timeline                                     | Stop offending authorized activity → budgets, retention, ownership, limits. Cost data lags the event.                                |

Official diagnostic references: [ALB errors and health](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-troubleshooting.html), [ECS service events](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-event-messages-list.html), [ECS health checks](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_HealthCheck.html), [IAM denials](https://docs.aws.amazon.com/IAM/latest/UserGuide/troubleshoot_access-denied.html), [S3 denials](https://docs.aws.amazon.com/AmazonS3/latest/userguide/troubleshoot-403-errors.html).

## CLI pocket reference

Use AWS CLI v2 and Identity Center profiles. Commands below are read-only except login/configuration; restore above creates a resource. Replace quoted placeholders with actual identifiers. Resource ARNs, IDs, URLs, and names are different argument types.

```bash
aws configure sso --profile aws-lab
export AWS_PROFILE=aws-lab AWS_REGION=us-east-1 AWS_PAGER=""
aws sso login
aws sts get-caller-identity                 # Verify account before every change.
aws configure list                         # Diagnose profile/Region provenance.

# Set these from IaC outputs/resource inventory, never from secret values.
export CLUSTER='your-cluster' SERVICE='your-service'
export TASK_ARN='your-task-arn' TARGET_GROUP_ARN='your-target-group-arn'
export VPC_ID='your-vpc-id' ROLE_NAME='your-role-name'
export REPOSITORY='your-ecr-repository' BUCKET='your-bucket'
export OBJECT_KEY='your-object-key' DB_ID='your-db-id'
export LOG_GROUP='/ecs/your-service' QUEUE_URL='your-sqs-url'
export SECRET_ARN='your-secret-arn' STACK='your-stack'
export API_HOST='api.example.com' DB_HOST='your-rds-endpoint'

aws iam get-role --role-name "$ROLE_NAME"
aws iam list-attached-role-policies --role-name "$ROLE_NAME"
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID"
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID"
aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE"
aws ecs list-tasks --cluster "$CLUSTER" --service-name "$SERVICE" --desired-status STOPPED
aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$TASK_ARN"
aws elbv2 describe-target-health --target-group-arn "$TARGET_GROUP_ARN"
aws ecr describe-images --repository-name "$REPOSITORY"
aws s3api head-object --bucket "$BUCKET" --key "$OBJECT_KEY"
aws s3api get-public-access-block --bucket "$BUCKET"
aws rds describe-db-instances --db-instance-identifier "$DB_ID" \
  --query 'DBInstances[].{Status:DBInstanceStatus,Endpoint:Endpoint.Address,LatestRestore:LatestRestorableTime}'
aws cloudwatch describe-alarms --state-value ALARM
aws cloudwatch list-metrics --namespace AWS/ECS --metric-name CPUUtilization
aws logs tail "$LOG_GROUP" --since 15m
aws sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names All
aws secretsmanager describe-secret --secret-id "$SECRET_ARN" # Metadata; no value.
aws cloudformation describe-stack-events --stack-name "$STACK"
aws cloudformation list-stack-resources --stack-name "$STACK"
```

`list-metrics` discovers dimensions; use `get-metric-data` for time series. `aws <service> <command> help` specifies argument types and pagination. `--query` is JMESPath filtering, not authorization. Logs can contain sensitive data; handle output appropriately. Avoid `get-secret-value` in shell transcripts and CI logs. [AWS CLI reference](https://docs.aws.amazon.com/cli/latest/reference/)

## Selection card and glossary

| Problem                        | Consider                               | Deciding question                                                                                                        |
| ------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Compute                        | ECS/Fargate, EC2, Lambda, EKS          | Container versus invocation? OS control? Sustained versus bursty? Need Kubernetes enough to operate it?                  |
| Database                       | RDS PostgreSQL/MySQL, Aurora, DynamoDB | Relational queries/transactions versus known key access patterns; availability, scaling, and compatibility requirements? |
| Objects / block / shared files | S3 / EBS / EFS                         | Object API, attached disk, or shared POSIX semantics?                                                                    |
| Cache                          | ElastiCache Valkey/Redis OSS           | What may be stale/lost; how will cache misses or failover affect DB load?                                                |
| Queue                          | SQS                                    | Durable work distribution, retries, ordering, idempotency?                                                               |
| Events / streams               | SNS, EventBridge / Kinesis             | Fan-out versus rule routing versus retained ordered replayable stream?                                                   |
| API/edge                       | ALB, API Gateway, CloudFront           | Reverse proxy, API policy surface, or global caching?                                                                    |
| DNS / certificates             | Route 53 / ACM                         | Public/private resolution; certificate Region and termination point?                                                     |
| Secrets                        | Secrets Manager, Parameter Store       | Rotation/lifecycle needs versus configuration storage?                                                                   |
| Monitoring/audit               | CloudWatch / CloudTrail                | Workload behavior versus AWS API activity?                                                                               |
| Security                       | IAM, KMS, WAF, GuardDuty, Security Hub | Authorization, encryption, HTTP filtering, threat detection, posture/findings? These solve different problems.           |

For capabilities and implementation details, use the companion foundation guide; this table is a decision index, not a claim that services are interchangeable.

| Term                             | Plain-English meaning → why you care                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| ARN                              | Resource identifier including service and often account/Region → exact policy/deployment target.    |
| Principal / STS session          | Acting identity / temporary role credentials → who is actually authorized.                          |
| Trust policy / permission policy | Who may assume role / what role may do → both must be correct.                                      |
| SCP / permissions boundary       | Maximum permission guardrails → granting IAM permission may still fail.                             |
| Region / AZ                      | Regional location / isolated zone within it → failure and data-placement boundaries.                |
| ENI / CIDR                       | Virtual network interface / address range → task addressing, subnet capacity, routes.               |
| SG / NACL                        | Stateful resource firewall / stateless subnet filter → return traffic differs.                      |
| Endpoint                         | Service address, or VPC private-access resource → determine which meaning applies.                  |
| Target group / listener          | Backend pool / frontend port-and-routing configuration → isolate ALB errors.                        |
| Task definition / task / service | Container recipe / running copy / desired-state controller → recipe update alone does not roll out. |
| Execution role / task role       | Agent startup permissions / application permissions → image pulling differs from app S3 access.     |
| Quota / throttling               | Allowed capacity / request-rate enforcement → scaling needs headroom and backoff.                   |
| Multi-AZ / replica               | Availability topology / copied data instance → verify failover versus read-scaling behavior.        |
| PITR / RPO / RTO                 | Historical restore / tolerable loss / tolerable recovery time → make recovery measurable.           |
| DLQ / visibility timeout         | Failed-work queue / temporary receive lease → processing is not automatic exactly-once execution.   |
| KMS key / envelope encryption    | Key-management object / data keys protected by another key → key access/deletion affects recovery.  |
| Change set / drift               | Proposed infrastructure diff / live divergence from IaC → review replacements and unmanaged edits.  |
| LCU / metric dimension           | Load-balancer billing capacity unit / metric identity label → cost and monitoring cardinality.      |

## Review gates

**IAM production checklist**

- [ ] Humans use federation/Identity Center and MFA; applications use workload roles; CI uses narrowly scoped OIDC trust.
- [ ] Root recovery and break-glass access are documented and tested; root is not used routinely.
- [ ] Trust, identity/resource policies, SCPs, boundaries, and KMS policies agree on actual access paths.
- [ ] `iam:PassRole` is scoped; deployment role cannot casually become workload administrator.
- [ ] Access Analyzer findings and policy validation are reviewed; unused access is removed.
- [ ] Any unavoidable long-lived keys have an owner, rotation process, monitoring, and replacement plan.

**Production security checklist**

- [ ] Accounts separate environments; management account has no application workload; recovery contacts and MFA are current.
- [ ] Only intentional entry points are public; DB/cache/tasks are private; SG rules use minimal ports and appropriate source SGs.
- [ ] TLS is verified end-to-end where required; storage/backups are encrypted; KMS access and deletion protection are reviewed.
- [ ] Secrets never enter Git, image layers, logs, or Terraform outputs; rotation is rehearsed with connection pools.
- [ ] S3 public-access protections, ownership, presigned URL expiry, and bucket policies match intended sharing.
- [ ] CloudTrail retention, GuardDuty/Security Hub findings, relevant Config rules, image/vulnerability scanning, and patch ownership exist.
- [ ] WAF rules are tested when used; application authorization still protects every tenant/resource.
- [ ] Backups and incident-response credentials survive workload compromise; responders have an exercised containment runbook.

**AI-assisted infrastructure review**

- [ ] State account/Region, availability, traffic, compliance, budget, and recovery assumptions; verify current feature support.
- [ ] IaC is reviewable; no hard-coded credentials; private resources and least privilege are defaults.
- [ ] Every wildcard/public route/ingress rule has a reason; validate IAM action/resource compatibility and trust conditions.
- [ ] Review plan/change set for deletion, replacement, permission expansion, retained resources, and dependency order.
- [ ] Destructive changes require explicit authorization plus a tested backup/rollback plan; never confuse authorization to draft with authorization to apply.
- [ ] Cost, quotas, AZ/subnet capacity, NAT/endpoints, certificate Region, logging, alarms, and restore permissions are covered.
- [ ] Record what was validated, what was deployed, and what remains unverified separately.

**Production readiness: final go/no-go**

| Area          | MUST have evidence for                                                                                                             |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Architecture  | Availability target; dependency/failure map; owner; capacity and quota headroom; justified complexity.                             |
| Networking    | Correct VPC/subnets/routes; private data tier; minimal SGs; working DNS/TLS and internal dependency paths.                         |
| IAM/security  | Federated humans; temporary workload/CI roles; reviewed cross-account trust; encryption/secrets; exposure review; threat response. |
| Application   | Readiness/liveness; deadlines; bounded retries/concurrency; idempotency; graceful shutdown; safe degradation.                      |
| Database      | Restore-tested backups/PITR; connection budget; migration lock/runtime analysis; failover handling; monitoring and upgrade plan.   |
| Observability | User SLIs/SLOs, logs/metrics/traces, tested alerts, dashboard, on-call ownership, audit retention.                                 |
| Deployment    | IaC plan reviewed; isolated CI identity; immutable artifact; smoke tests; rollback; expand-contract schema compatibility.          |
| Reliability   | AZ-loss/restart/dependency drills; measured recovery; documented RTO/RPO; backup separation; failback procedure.                   |
| Cost          | Estimate and spending owner; budgets/anomalies; idle-resource cleanup; transfer/log/storage controls; commitment review.           |

## Next 30/60/90 days

| Period     | Build and practice                                                                                                                                           | Demonstrate before moving on                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Days 1–30  | Finish account/IAM/network labs; deploy container API with HTTPS, private RDS, secrets, and logs using IaC. Destroy/recreate the disposable environment.     | Explain one request and every identity/network boundary. Diagnose a deliberate bad SG, image tag, and IAM permission without granting administrator access.            |
| Days 31–60 | Add OIDC CI/CD, S3 uploads, SQS worker/DLQ, measured autoscaling, dashboard, alarms; introduce cache only after measuring value.                             | Roll back a bad release; handle duplicate jobs; load-test connection budgets; explain monthly cost by driver.                                                          |
| Days 61–90 | Exercise task/AZ/dependency failure; restore database/data; review security and quotas; implement DR matching business RTO/RPO; conduct incident simulation. | Rebuild from code and backups; measure actual loss/recovery; produce a runbook, readiness review, and architecture/cost trade-off record another engineer can operate. |
