# AWS from first principles: state, boundaries, and operated services

**Learner question:** how do AWS services turn an application requirement into authorized, reachable, durable, recoverable work—and which parts still belong to the application?

[Domain entry](README.md) · [20 local labs](aws-service-lab/README.md) · [Cloud workbook](CLOUD-LABS.md) · [Exercises and design review](EXERCISES.md) · [Sources](references/README.md)

## 0. Curriculum contract and dependency map

Treat a service as a contract over state and transitions. A product name alone does not answer who can mutate that state, whether an acknowledgement implies completion, where order exists, or how a failed operation is recovered.

```text
program → process → resource limits → compute / containers / functions
bytes → object / block / file → versions → transactions → recovery
identity → temporary credentials → authorization → delegation
address → route → network filter → listener → DNS / TLS / application
partial failure → retry → durable identity → conditional writes → idempotency
delayed work → queue lease / event fanout / retained stream → checkpoints
desired state → reconciliation → deployment → observation → repair
failure domains + workload + quoted units → capacity / resilience / cost
```

Each lab has a small implementation, a deliberate failure, boundary checks, AWS transfer tasks and specific exercises. **Local models define their own assumptions; they do not reproduce AWS internals.** Real-service contracts are linked next to claims. The original six chapters and 18 cloud labs remain the detailed deployment reference, with their original research date and limitations preserved.

Use this learning loop for every chapter:

1. Name state, actors and transaction boundary.
2. Predict a worked trace before executing it.
3. Run the model; identify which transition changed which field.
4. Break one assumption; retain the smallest counterexample.
5. Compare the relevant AWS contract and run its cloud exercise when appropriate.
6. Record expected versus actual observations, cleanup and unresolved differences.

Start without an AWS account:

```bash
cd domains/aws/aws-service-lab
python3 run.py demo --stage 01
python3 run.py experiments --stage 12
python3 run.py test
```

Python 3.10+, standard library only. Cloud commands are separately documented and never run by the local lab runner. The existing deployment commands use `domains/aws/service-lifecycle/` as their working directory.

### Six ideas compress most AWS reasoning

| Idea | Smallest model | Failure that requires the next abstraction |
| --- | --- | --- |
| Ownership and delegation | Principal can act on a named resource | Wrong account, expired session, excessive authority → scoped policy/trust/context |
| Reachability | A packet has a destination | Missing return path or listener → routes, stateful filters, names, TLS |
| Durable identity | Stable key names stored bytes or work | Retry repeats an effect → conditional mutation and persisted receipt |
| Bounded capacity | Finite slots do work over time | Arrival exceeds service → queues, scaling, limits, admission |
| Reconciliation | Desired state is compared with observed state | Accepted intent is not readiness → controllers, health gates, failure repair |
| Evidence and economics | Observe outcomes and account for consumed units | Hidden tails/dependencies/retained resources → SLOs, restore tests, cost inventory |

For any AWS service fill this card: **scope; principal; action; resource; network path; state; atomic boundary; retry semantics; ordering; failure domain; capacity unit; billing unit; observability; backup/export; cleanup**.

<a id="stage-01"></a>
## 1. Control plane: commands request state transitions

A program is mutable state plus transitions. A managed resource adds a control API that requests transitions in another system. Creating a service describes desired configuration; the processes, ENIs, targets and application readiness follow through other transitions.

$$ (S', result)=T(S, principal, action, resource, context). $$

An API timeout leaves uncertainty: the request might have failed before acceptance, succeeded while the response was lost, or still be running. Retrying blindly can duplicate resources. A stable request identity lets a supported API distinguish a retry from new intent. Token support and its scope are API-specific; a universal client token cannot be assumed.

```text
client sends intent → accepted → provisioning → ready → health verified
                           └──────── failure → diagnosis → new attempt
response lost → retry same intent/ID → recover original outcome where supported
```

[Lab 01](aws-service-lab/01-control-plane/README.md) exposes accepted/pending versus failed/ready and rejects changed intent under one token. **Build:** add deletion generations. **Observe in AWS:** inspect both stack events and service health in original labs 3/6. A change set previews proposed changes; it is not proof they can successfully execute. [CloudFormation change sets](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html).

## 2. Identity: permission is a predicate over an exact request
<a id="stage-02"></a>

Authentication identifies the caller. Authorization determines whether this action on this resource in this context is permitted. Delegation answers who can assume a role; the assumed role's permissions answer what that session may do. Application tenant authorization is another boundary.

The simplest policy is an allow-list of `(action, resource)` pairs. Conditions refine it: prefix, environment, source context, principal tags or other service-supported attributes. Default deny catches missing grants; explicit deny protects an invariant against an accidentally broad allow.

For the **bounded identity-policy model**:

$$ allowed = grant \land boundaryAllows \land \neg applicableExplicitDeny. $$

Real IAM evaluates additional policy types and distinguishes principal forms, same-account resource grants and cross-account access. A permissions boundary or organization guardrail is not a grant. Do not extrapolate the small formula to all IAM requests. [Detailed IAM evaluation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic_policy-eval-denyallow.html), [policy combinations](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html).

| Identity | Owns | Common mistake |
| --- | --- | --- |
| Human/federated developer | Interactive authorized work | Debugging the correct service in the wrong account/profile |
| Deployment role | Reviewed provisioning | Giving the application provisioning authority |
| ECS execution role | Platform tasks such as supported image/log/secret operations | Expecting application SDK calls to inherit it |
| ECS task role / Lambda execution role | Application AWS API calls | Treating IAM permission as customer authorization |

[ECS task role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html), [execution role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html).

[Lab 02](aws-service-lab/02-identity-and-permissions/README.md) distinguishes prefix, condition, explicit deny, boundary and expiry. Workbook A tests a real policy request matrix. **Exercise:** write one allowed and three denied requests before writing a policy.

## 3. Networking: every request has a return path
<a id="stage-03"></a>

An address identifies a destination; a route chooses the next hop. A subnet places interfaces in an address range and AZ. A firewall permits or blocks a flow; neither routing nor permission creates an application listener. IAM authorizes supported API requests, while network controls restrict reachability. Both can be required.

Route selection uses the most specific matching prefix. A TCP client uses a temporary source port: `client:49152 → server:443`; the reply is `server:443 → client:49152`. Filtering both directions as destination port 443 drops the return traffic in a stateless model.

Security groups are stateful; permitted connection response traffic is handled through connection state. Network ACLs operate at subnet boundaries and require explicit direction/rule reasoning. [Security groups](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-security-groups.html), [network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html).

```text
client → public ALB subnet → private task subnet → isolated DB subnet
                            └→ service endpoints / required egress
     IAM/API authorization and DNS resolution remain separate checks
```

An internet gateway, NAT gateway and VPC endpoint solve different path problems. A NAT route alone does not make a task an internet-reachable server. An endpoint narrows an AWS-service path but adds endpoint policy/DNS considerations. Map each dependency: ECR image retrieval, logs, secrets, DB, cache and application traffic.

[Lab 03](aws-service-lab/03-network-paths/README.md) breaks a return ACL and exposes route/SG/listener failures separately. Original lab 3 creates the concrete topology. **Design:** draw arrows in both directions and annotate every security boundary.

## 4. Names and edge caches add independent state
<a id="stage-04"></a>

DNS maps a name to an answer through authorities and caches. Updating one authority does not synchronously update every resolver. TLS then establishes server identity and a protected channel; HTTP carries application semantics. An edge cache adds another copy of content, with its own key, expiry and invalidation rules.

```text
hostname → cached DNS answer → connection → certificate identity → HTTP
                                               ↓
                                  edge response or origin request
```

DNS TTL bounds one cache entry under its policy; it is not an instant failover mechanism. A certificate-name error, a stale DNS answer, a cached old response and a 503 from an unhealthy origin should lead to different investigations. CloudFront caching depends on policy plus origin response directives; specify a complete cache key before caching personalized content. [Route 53 records](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-values-basic.html), [CloudFront expiration](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/Expiration.html).

[Lab 04](aws-service-lab/04-dns-and-edge/README.md) holds an old answer until logical second 30. Original lab 7 supplies actual DNS/TLS checks. **Exercise:** define a rollback that remains safe while different clients resolve different endpoints.

## 5. Object storage: whole values, named versions, conditional writes
<a id="stage-05"></a>

Object storage maps `(bucket, key[, version])` to a complete object and metadata. A slash in a general-purpose object key can express an application prefix; it does not provide filesystem rename/locking semantics. Whole-object replacement simplifies storage but makes read→modify→write a concurrency problem.

S3 provides strong consistency for documented object read/write/list behavior; that does not create an atomic multi-key transaction or merge two writers' intent. [S3 consistency](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html).

```text
A reads token v1            B reads token v1
A writes If-Match(v1) → v2  B writes If-Match(v1) → precondition failure
```

Use create-only `If-None-Match: *` or a current ETag precondition when appropriate. Treat an AWS ETag as the service's comparison token; do not assume it is universally an MD5 content checksum. Versioning preserves older versions; a delete marker changes current visibility while earlier bytes can remain. [Conditional writes](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html).

[Lab 05](aws-service-lab/05-object-storage/README.md) implements this conflict and deletion history. Workbook B operates on a synthetic key and captures actual version IDs. **Challenge:** design asset metadata that pins an exact version rather than accidentally processing whichever bytes are current later.

## 6. Block and file storage: bytes need an application consistency boundary
<a id="stage-06"></a>

| Access model | Interface | Application must supply | Typical AWS mapping |
| --- | --- | --- | --- |
| Object | Whole named objects | Object identity, conditional updates, prefix conventions | S3 |
| Block | Reads/writes at offsets | Filesystem or database page/log interpretation | EBS |
| File | Paths and file operations | Concurrent access and file/application semantics | EFS or relevant FSx filesystem |
| Ephemeral local | Temporary bytes near compute | Rebuild/retry after replacement | Instance store or disposable task storage |

A filesystem translates names into blocks and maintains metadata. A database adds a log and transaction ordering. A snapshot of blocks does not alone prove that buffered application state or an external effect belongs to the same cut.

[Lab 06](aws-service-lab/06-block-storage/README.md) separates pending from durable writes, then takes an immutable snapshot. The failure model is a teaching assumption, not evidence about host power loss. EBS volumes are AZ-scoped block resources with their own attachment and lifecycle rules. [EBS volume contract](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes.html).

**Exercise:** flush a metadata pointer before its new data block; draw a snapshot that references missing data. Explain how WAL, filesystem ordering or an application-aware backup changes the recovery procedure.

## 7. Compute and scaling: derive capacity from occupancy
<a id="stage-07"></a>

If arrivals average `λ` requests/s and each occupies a processing slot for `S` seconds, mean occupied slots are `λS`. With homogeneous slots and utilization target `u`, a simple capacity estimate is:

$$ n = clamp(\lceil \lambda S/u\rceil, n_{min}, n_{max}). $$

This uses service occupancy, not end-to-end latency with arbitrary waiting, and is not a cloud autoscaling algorithm. If arrival rate exceeds sustainable completion rate, backlog grows. More application workers may worsen a database bottleneck by opening more connections.

EC2 gives machine-level control and corresponding image/patch/capacity obligations. Containers package a process; a scheduler places requested resources. Functions delegate invocation/environment scheduling. These choices change operational ownership, not the need for finite capacity and failure handling.

[Lab 07](aws-service-lab/07-compute-and-scaling/README.md) computes capacity and remaining slots after one AZ loss. **Break:** increase service time while leaving traffic constant. Original labs 15/16 compare configured scaling with actual events and health. Surviving capacity, dependency resilience and provisioning delay must all be evaluated.

## 8. Containers: desired count, placement, revision and health
<a id="stage-08"></a>

A scheduler asks whether a task's requested CPU, memory, networking and placement constraints fit available capacity. Satisfying only one dimension can leave work pending. A controller then tries to reconcile desired tasks with observed tasks. ECR stores image artifacts; a task definition describes execution; a service maintains a desired workload. [ECS services](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_services.html).

```text
source → image build → immutable digest → task definition → task startup
                                      → health gate → traffic → drained old revision
```

“Two healthy tasks” and “two healthy tasks using the new digest” are different deployment claims. Keep readiness, liveness, startup and business outcome checks distinct. Load balancer behavior has specific exceptions: ALB can fail open when all registered targets in its relevant target group are unhealthy; a toy health gate is not that behavior. [ALB health checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html).

EKS supplies a managed Kubernetes control plane; workload, node/execution mode, network, storage and authorization choices still exist. Learn Pods/Deployments/Services and reconciliation before using Kubernetes as an unexplained packaging layer. [EKS scope](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html).

[Lab 08](aws-service-lab/08-container-scheduling/README.md) exposes memory-bound placement and digest-specific health. Original labs 5/6/11 deploy by digest and verify task revision. **Build:** add draining without exceeding a maximum-unavailable bound.

## 9. Serverless: invocations are work with scheduling and retry contracts
<a id="stage-09"></a>

A function invocation consumes a slot for its duration. Reusable execution environments can retain caches, connections and initialized code, but reuse is not durable storage. Reserved concurrency limits/allocates concurrency; provisioned concurrency prepares execution environments. They address different constraints. [Lambda concurrency](https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html), [runtime/environment contract](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html).

| Invocation path | Where retry responsibility lives | Application consequence |
| --- | --- | --- |
| Synchronous direct call | Caller/service path | Inspect function errors as well as API success |
| Asynchronous invocation | Lambda's queue/retry policy plus caller submission | Duplicate events and terminal failure handling remain possible |
| Event-source mapping | Source/mapping configuration | Reason about batch acknowledgement and source checkpoints |

An invocation request accepted by an API is not equivalent to a successful business effect. Async retries and duplicate deliveries require idempotent application behavior. [Lambda async error handling](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-error-handling.html).

[Lab 09](aws-service-lab/09-serverless-invocations/README.md) loses a seen-ID cache on recycling. Workbook E fails after a durable conditional write and repeats the same business ID. **Design:** choose an idempotency lifetime at least as long as the allowed retry/replay horizon.

## 10. Key-value databases: access pattern, partition key, atomic predicate
<a id="stage-10"></a>

An access pattern is a query you must answer: “one item by key,” “orders for a tenant ordered by time,” or “work not yet processed.” Design keys/indexes to answer it before choosing capacity settings. Hash-distributing many keys does not distribute one hot key's traffic. A secondary index is another representation with its own consistency and cost.

Concurrency requires an atomic precondition inside the mutation:

```text
if stored.version == expected_version:
    store(new_value, version + 1)    # condition + effect in one service operation
else:
    reject                         # application decides whether/how to retry
```

A fresh read can become stale immediately; it does not reserve the item. DynamoDB conditional expressions can guard writes. Strong read options apply to tables/LSIs; GSIs and streams have different read behavior. Global-table consistency also depends on its configured mode, so do not treat all multi-region tables as one consistency model. [Conditions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html), [read consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html).

[Lab 10](aws-service-lab/10-conditional-database/README.md) races two expected-version writes and delays one read replica. Workbook D demonstrates the condition on a real item. **Exercise:** choose a tenant/key schema for a high-volume tenant, then identify its hottest logical key.

## 11. Relational transactions: keep related invariants in one commit
<a id="stage-11"></a>

SQL expresses relations and queries; transactions give a boundary for state invariants. A uniqueness constraint can encode a stable operation receipt. A transaction can couple that receipt with its business effect:

```text
BEGIN
  if receipt exists: verify same request content; return prior result
  else: insert receipt; apply effect
COMMIT
```

Atomicity alone does not choose an isolation level; reads and concurrent writes still need a declared isolation/locking strategy. A database transaction cannot atomically send an external email or erase a separate object without another protocol. A transactional outbox records intent locally, then dispatches it with retries and downstream deduplication.

[Lab 11](aws-service-lab/11-transactions-and-recovery/README.md) uses real standard-library SQLite: rollback, unique receipts, persisted restart and a backup cut. It does not establish PostgreSQL/RDS behavior. Original labs 8/9 provide private PostgreSQL, restricted SQL credentials and bootstrap acceptance checks.

RDS PITR creates another DB instance; recovery also requires configuration, access, data verification and application cutover. [RDS point-in-time restore](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html). **Exercise:** identify every effect a SQL rollback cannot reverse in an order workflow.

## 12. Queues: visibility is a lease, acknowledgement is another operation
<a id="stage-12"></a>

A work queue decouples acceptance from processing. Receive returns a delivery, not deletion. Visibility temporarily hides a message; a crash or delayed consumer can let it reappear. Acknowledge/delete is separate from committing an application effect.

```text
receive → process → commit effect → delete
                       │             │
                       └ crash ──────┘ → redelivery → persisted receipt → no repeated effect
```

Use a business ID for deduplication; a receipt handle identifies one delivery attempt. SQS Standard uses at-least-once delivery, and visibility does not eliminate all duplicates. Use the latest receipt handle; a successful old-handle DeleteMessage response does not universally prove deletion. [Visibility](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html), [DeleteMessage semantics](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_DeleteMessage.html).

FIFO adds ordering within message groups and producer deduplication rules; consumer crash gaps and external side effects still need application reasoning. Long polling reduces empty receive loops; a DLQ isolates repeated failures for diagnosis. Retry transient errors; reject malformed work deliberately.

[Lab 12](aws-service-lab/12-queues-and-workers/README.md) distinguishes visibility, fresh handles and poison-message count. Workbook C forces redelivery without waiting for chance. **Design:** set visibility from processing bounds and extension policy; separately define how late workers are fenced from unsafe writes.

## 13. Events and pub/sub: one fact can drive independent consumers
<a id="stage-13"></a>

Competing queue workers collectively perform work; independent subscribers each need their own copy or retained view. An event describes an accepted fact, while a command asks another actor to do work. Keep schema version, source, business ID and correlation context explicit.

| Mechanism | Primary concern | Failure to plan for |
| --- | --- | --- |
| SQS | Durable competing work | Redelivery, poison work, visibility |
| SNS | Fanout to subscribers | Independent delivery failures, consumer durability |
| EventBridge | Event matching/routing | Pattern/schema mismatch, target failure |
| Step Functions | Explicit workflow state | Retry, compensation, bounded terminal outcomes |
| Application outbox | Close DB/publish crash gap | Duplicate dispatch and downstream effects |

EventBridge patterns decide which events match a rule; targets have their own delivery/permission configuration. [Event pattern contract](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html). The table is a conceptual responsibility comparison, not a claim that these services have identical guarantees.

[Lab 13](aws-service-lab/13-pubsub-and-events/README.md) fails only the audit target, then retries it. **Exercise:** retry every subscriber after one fails; count the duplicated billing effect and repair it with a stable receipt.

## 14. Streams: history outlives one consumer's progress
<a id="stage-14"></a>

An operation log retains records with positions; consumers keep independent positions. A shard gives an ordering scope. Partition keys route related records to that scope, but one hot key can concentrate load. Kinesis exposes records, partition keys, shards and sequence identifiers through its service contract. [Kinesis concepts](https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html).

```text
commit effect → crash before checkpoint → record replayed
checkpoint → crash before effect       → consumer skips unapplied record
```

Exactly-once effects require a suitable sink transaction/deduplication boundary, not merely a checkpoint API. A stale checkpoint beyond retention requires another recovery path. Resharding adds ancestry and coordination; an integer offset toy does not implement it.

[Lab 14](aws-service-lab/14-streams-and-checkpoints/README.md) has two consumers and per-shard next-offset checkpoints. **Challenge:** analytics needs historical independent replay; show why deleting a message from one shared work queue does not supply that history.

## 15. Caches: define permissible staleness before caching
<a id="stage-15"></a>

Cache-aside is `read cache → miss → read authority → fill cache`. Invalidation after a write looks sufficient until a delayed earlier read fills stale data afterward:

```text
R reads DB version 1 ──────────────── fills cache with v1
                 W commits v2 → invalidates cache
```

Version-aware fill, fencing, immutable versioned keys or a declared TTL/staleness contract can address different parts of this problem. A local version check is only atomic in its local model; distributed check-then-fill can race again. A stampede adds a separate capacity problem; single-flight reduces repeated misses for one key.

[Lab 15](aws-service-lab/15-cache-and-invalidation/README.md) compares unsafe and guarded fill. Original lab 14 only establishes TLS cache connectivity. **Exercise:** define behavior when the cache is unavailable, then verify that cache failure cannot turn a backing-store limit into a larger outage.

## 16. Secrets and keys: protect data and credential lifecycle separately
<a id="stage-16"></a>

Secret storage controls distribution of credential values. Rotation must synchronize credential consumers with the authenticating system. A process that receives a startup environment variable has captured a value; changing the secret's current version does not mutate that process. ECS requires a new task/appropriate deployment to consume updated injected values. [ECS secret injection](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html), [rotation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html).

Envelope encryption separates data encryption from wrapping its data key. KMS adds authorization, key state and authenticated encryption-context considerations. These do not replace application tenant checks or prevent logging plaintext after authorized decryption. [KMS concepts](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html).

[Lab 16](aws-service-lab/16-secrets-and-keys/README.md) models generations and authorization gates. It stores plaintext internally and performs no encryption; its opaque tokens teach a boundary only. **Design:** enumerate failure points in changing a DB password, updating its secret and replacing tasks. Original lab 9 intentionally leaves automated app-secret rotation unimplemented.

## 17. Observability: measure the outcome and the failed boundary
<a id="stage-17"></a>

Logs describe discrete events; metrics aggregate defined populations/windows; traces join causally related operations. CloudTrail records supported AWS API/audit activity, while application logs describe business/request behavior. A metric name without units, aggregation and dimensions is ambiguous.

Define good events over eligible events. For objective `s` and `N` eligible requests, allowed failures are `N(1-s)`; budget burn is observed failures divided by that allowance. Choose the window and failure criteria before computing the ratio. Latency percentiles require a specified quantile method and sufficient sample population.

CloudWatch alarm evaluation has explicit thresholds, periods and missing-data behavior; an alarm also needs a useful notification/action and response owner. [Alarm contract](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Alarms.html).

[Lab 17](aws-service-lab/17-observability-and-slos/README.md) shows how a mean and even p99 can hide the worst request, plus how missing data changes an alarm. Original lab 10 wires notification to a human. **Exercise:** add oldest-queue-age and synthetic end-to-end success; explain which outages CPU does not detect.

## 18. Infrastructure as code: review identity, replacement and recovery
<a id="stage-18"></a>

IaC declares desired resources; a reconciler maps them to API transitions. A source diff expresses intent; a plan/change set previews a particular proposed execution. Resource properties determine whether changes can be applied in place or require replacement. Replacement can change identity and data ownership.

```text
immutable build → exact proposed change → review → execute that change
                                              → revision + health verification
                                              → diagnosis / rollback / repair
```

Pin a deployed image digest and the reviewed change identity. Record drift separately. Rollback of resource configuration does not undo database migrations, external emails or already accepted business operations.

[Lab 18](aws-service-lab/18-iac-and-deployments/README.md) rejects a changed observed base; this is a deliberate stronger toy precondition, not a CloudFormation guarantee. The real service previews replacements without guaranteeing success. [Change-set limits](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html). Use the existing plan/apply helpers and inactive CI example as inspectable deployment material.

## 19. Cost and resilience: inventory shared dependencies and retained state
<a id="stage-19"></a>

Cost is a sum of quantities with compatible quoted units:

$$ cost=\sum_j quantity_j \times regionalRate_j. $$

Requests, GB-months, instance hours, provisioned capacity, transfer and retained backups are different units. Use current pricing for the selected service/region; the model's numeric rates are invented. A budget notification is not a spending cap. Stack deletion and final resource absence are also different claims.

A service path works when every required dependency along it works. Redundant application paths sharing one required database, credential source or zonal egress path can fail together. Do not multiply independent probabilities when failures are correlated. Note which dependency is required for new task startup versus existing request serving.

| Recovery term | Observable definition | Insufficient substitute |
| --- | --- | --- |
| RTO | Incident start until verified usable restoration | Restore API duration alone |
| RPO | Accepted data absent from recovered state, expressed as appropriate time/data loss | Backup configured or restore command succeeded |
| Availability | Required successful outcomes over a defined interval/population | Count of running tasks |
| Durability | Accepted state surviving the stated failure model | A successful ordinary restart alone |

[Lab 19](aws-service-lab/19-cost-and-resilience/README.md) exposes a shared NAT/DB dependency and a lost operation outside a snapshot. Original labs 17/18 require actual restore evidence and deliberate teardown. **Exercise:** cost both an idle month and an active workload; include retained versions/snapshots after deletion.

## 20. Capstone: an operated asset-processing workflow
<a id="stage-20"></a>

Build one business operation: accept an asset command, process immutable input, store a result once per command identity, and recover from retries.

```text
command ID + payload → authorized acceptance → durable command + outbox
                                  │
                                  ▼
                            dispatcher → queue → worker
                                              │
                       duplicate delivery ────┤
                                              ▼
                           atomic receipt + result → acknowledge
```

[Lab 20](aws-service-lab/20-operated-service/README.md) persists one JSON transaction file, pins payload identity and shows:

1. Lost submission reply → same command retry → no new command.
2. Lost publish confirmation → publisher restart → duplicate queue copies.
3. Worker crash after commit before ACK → restart → receipt prevents another effect.
4. Reused ID with changed content → rejected conflict.
5. Persistence failure → no accepted candidate published by the modeled write boundary.

The local transaction couples related state in one file. A real design must place its boundary explicitly: S3 upload is separate from a DynamoDB transaction; an outbox plus command/receipt can share a database boundary, and queue sends need downstream idempotency. Orphan object cleanup and dispatch recovery remain application protocols. Do not treat the JSON file as evidence of cross-service atomicity.

Workbook D/E deploys a deliberately narrower Lambda/DynamoDB example: one conditional item is both the receipt and the entire effect. It proves no email/payment/S3 side-effect guarantee. The original container labs supply the separate operated-service deployment.

### Decision framework

| Requirement | Derive a mechanism | Question before choosing AWS resources |
| --- | --- | --- |
| Store large immutable assets | Object key + exact version + metadata | Who can upload/read, how do you handle orphan versions? |
| Conditionally mutate one item | Atomic predicate + stable key | What happens to stale writers and hot keys? |
| Maintain related SQL invariants | Transaction + isolation + constraints | Which effects are outside the database? |
| Process durable delayed work | Queue + lease + receipt + DLQ | What if effect commits but deletion fails? |
| Independent subscriber actions | Fanout + each subscriber's durable state | How do partial delivery and schema changes recover? |
| Replay analytics history | Retained partitioned stream + checkpoints | What order scope and retention horizon are required? |
| Long-running controllable service | Process/container scheduling + health | Who patches, scales, provisions and drains it? |
| Event-scoped execution | Function + invocation/retry boundary | What concurrency and idempotency lifetime are needed? |
| Lower repeated-read latency | Cache + complete key + staleness contract | Can fallback overload the authority? |
| Recover accepted state | Consistent backup + restore + cutover | What observed RTO/RPO supports the claim? |

For a new product, write its state model, mutation authority, transaction boundaries, ordering and retry requirements **before** naming AWS services. Draw the request and recovery paths, specify capacity/billing units, then justify the smallest architecture that satisfies those constraints. The [design challenges](EXERCISES.md) require that explanation and counterexamples.
