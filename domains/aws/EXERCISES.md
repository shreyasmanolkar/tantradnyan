# Exercises, checkpoints, and architecture challenges

[Master guide](GUIDE.md) · [Stage walkthroughs](aws-service-lab/README.md) · [Cloud workbook](CLOUD-LABS.md)

The 20 stage walkthroughs contain **81 specific exercises**. Start with the prediction and code-change exercises, then the AWS comparison. Record your own answer before reading this review. A reference explanation is not evidence that your code or cloud account behaves that way.

## 1. Checkpoint explanations

| Stage | Explain without opening the code | Reference reasoning / counterexample |
| --- | --- | --- |
| 01 control plane | Why is one accepted resource still unusable? | Acceptance records intent; readiness requires successful reconciliation and health. A same-token retry finds the existing identity; a new token is new intent in the model. |
| 02 permissions | Why does a boundary with `Allow *` not authorize an ungranted action? | A boundary caps the identity grant in this bounded model. No underlying grant remains implicit deny; an applicable explicit deny survives a broad allow. Real resource-policy principal exceptions require the IAM contract. |
| 03 network | Which port is on the reply's destination? | The client's source port, 49152 in the fixture. A stateless port-443-only egress rule drops that reply. Stateful SG semantics are a separate mechanism. |
| 04 names | Can a correct authority change immediately fix every client? | Existing cache entries remain until expiry under their cache policy. DNS answer, certificate identity, HTTP response and cached content are distinct states. |
| 05 objects | Why is a strong read insufficient for editing shared content? | Another writer can change the object between read and write. A precondition must be checked inside the write. A delete marker can hide current content while old versions remain stored. |
| 06 blocks | Why is a snapshot not necessarily an application-consistent backup? | Durable bytes may omit buffered state or span incomplete application work. Logs, flush/order rules and a consistency cut connect bytes to invariants. The toy defines a pending/durable boundary; it proves nothing about host power loss. |
| 07 scaling | Derive 4 slots from the example. | `20/s × 0.1 s = 2` mean occupied slots, divided by utilization target 0.5 gives 4. Slots are homogeneous modeled capacity, not a universal vCPU throughput conversion. |
| 08 containers | Why does the third task stay pending with 6 CPU units free? | Two 512-memory tasks consume all 1024 memory. CPU alone cannot satisfy a two-dimensional request. Counting old healthy tasks also does not prove the new digest is healthy. |
| 09 functions | Why can warm-memory deduplication repeat work? | The seen-ID cache belongs to an execution environment. Another environment or replacement has no receipt. Store business idempotency at a durable atomic boundary. |
| 10 conditional DB | What does the second writer know after rejection? | Its expected version is no longer current. Re-read/recompute or reject according to business semantics; blindly changing the condition to “latest” can apply stale intent. |
| 11 SQL | Why are receipt and balance in the same transaction? | Separate commits admit effect-without-receipt duplication or receipt-without-effect loss. Rollback in the fixture leaves neither change; snapshot total 7 omits later accepted amount 2. |
| 12 work queue | Why is visibility not exactly-once execution? | A lease hides work temporarily; effects and deletion happen at different boundaries. A worker can commit and crash before delete. Receipt handles identify deliveries; business IDs identify effects. |
| 13 fanout | Why does audit retain a copy after billing consumes? | Each subscriber has independent durable work. Retrying every subscriber after one target failure can duplicate the already successful targets. |
| 14 stream | Which checkpoint ordering produces loss? | Advancing checkpoint before effect, then crashing, skips unapplied work. Effect before checkpoint produces replay, requiring an idempotent or transactional sink. |
| 15 cache | Why does invalidation not prevent the fixture's stale read? | An old fetch finishes after invalidation and repopulates stale content. Guarded fill rejects an outdated version locally; a distributed guard needs a suitable atomicity/fencing protocol. |
| 16 credentials | Which state changes when the secret rotates? | The secret's current value/version changes; a running process's captured environment does not. Credential rotation must coordinate authenticating system, stored value and consumers. The token model provides no encryption. |
| 17 telemetry | How does p99 miss a 1000 ms request? | With 99 fast and one slow sample, nearest-rank p99 is the 99th fast value. Two slow samples move that quantile. Quantile method and window/population matter. |
| 18 desired state | Why can't a reviewed plan predict all effects? | Resource transitions can fail; replacement changes ownership; an external side effect is not undone by configuration rollback. The model's base fingerprint is a stronger toy check, not a CloudFormation promise. |
| 19 recovery/cost | Why are two paths not independent? | Both require the same modeled NAT/DB. Failure removes their shared prerequisite. Charges likewise include recurring and retained resources, not only completed requests. |
| 20 workflow | Why do two queue copies produce one modeled effect? | The first worker commits effect and receipt together; all later deliveries see the receipt. The JSON file is one local transaction boundary, not a cross-service AWS transaction. |

## 2. A useful exercise submission

Submit one page or run record containing:

1. **Question and state:** names, owners, versions, queues, receipts and units.
2. **Prediction:** exact worked outcome and one counterexample.
3. **Implementation change:** smallest transition needed; link the diff or function.
4. **Observation:** command, inputs, source revision, raw result/error and interpretation.
5. **Limits:** modeled guarantee versus AWS contract versus untested assumption.
6. **Recovery and cleanup:** what survives restart, what remains billable, next experiment.

Passing supplied checks is one observation. Add a counterexample independent of the implementation; do not mark your learning outcome verified merely because a generated check passes.

## 3. Design challenge: private API with PostgreSQL

**Requirement:** a small team operates a private container API with public HTTPS ingress, restricted SQL credentials, 100 requests/s expected peak, deployment rollback and restore evidence. The database holds the source of truth.

Specify request state/operation, authentication and tenant authorization, task/execution/deployment identities, client→ALB→task→DB paths, task startup paths, image digest, connection-pool/concurrency bounds, readiness, migrations, observability, backups and teardown.

**Counterexamples to address:** healthy old tasks disguise a failed revision; app-secret rotation leaves old tasks failing; increasing tasks overwhelms the DB connection limit; two task AZs depend on one egress path; a restored DB exists but app configuration still points to the failed instance.

**Reference direction:** original container labs are a bounded starting architecture. Derive worker/connection limits from workload, distinguish liveness from readiness and business health, verify revision and target health, rehearse restore/cutover. Their one-NAT/initial single-AZ DB shortcuts require an explicit resilience upgrade before claiming AZ-failure tolerance.

## 4. Design challenge: idempotent asset processing

**Requirement:** clients upload objects, processing can take ten minutes, duplicate requests/deliveries occur, workers restart, and each accepted business command must retain a discoverable terminal result.

Define command ID/content binding, exact object version/digest, job state machine, authorization, atomic receipt/result boundary, dispatch outbox, queue visibility/extension, poison-work classification, status reads, orphan cleanup and replay horizon.

```text
accepted → ready-for-dispatch → queued → processing → completed / terminal-failure
                      retry at every uncertain boundary; preserve business ID
```

**Counterexamples:** uploaded object without job; job references overwritten current key; dispatcher sends then loses confirmation; worker commits then dies before delete; receipt expires before an old delivery returns; stale worker writes after its lease expires.

**Reference direction:** pin input version, couple job/outbox or receipt/result in an appropriate database transaction, tolerate duplicate sends and guard effects. Workbook E's one-item effect illustrates a narrower conditional boundary; arbitrary multi-service effects require more recovery design. A queue receipt is not an asset command ID.

## 5. Design challenge: fanout and replay analytics

**Requirement:** billing, audit and analytics react independently to accepted orders. Audit needs retained replay; a billing outage must not stop shipping; analytics may restart and see earlier records again.

Specify immutable event schema/version, routing filters, subscriber durable state, per-target retries/DLQ, ordering scope, partition key, independent checkpoints, retention, idempotent sinks and schema compatibility.

**Counterexamples:** one shared work queue distributes rather than broadcasts; a broad retry repeats billing; checkpoint before effect loses data; partial batch retry reorders a customer stream; retention expires before audit recovers; one high-volume tenant becomes a hot key.

**Reference direction:** use independent durable subscriber work for fanout and a retained log/stream where replay is a requirement. Separate routing from retention and sink atomicity. Explain any ordering guarantee precisely per key/group/shard rather than saying “events are ordered.”

## 6. Design challenge: cache under a burst and a failure

**Requirement:** reads spike tenfold, data can be stale for at most a declared interval, a few keys are very hot, and cache unavailability must not exceed database capacity.

Specify full key/tenant identity, source of truth, TTL, delayed-fill race, invalidation/version scheme, single-flight, negative caching, admission/rate limits, fallback bounds and metrics.

**Counterexamples:** old reader refills after invalidation; all readers miss simultaneously; cached authorization leaks across tenants; cache failure causes unlimited DB fallback; local version guard assumes a distributed atomic operation that does not exist.

**Reference direction:** choose acceptable consistency first. Immutable versioned keys simplify some races; conditional/fenced fill requires a real boundary. Single-flight reduces duplicate fetches but does not create new DB capacity. The original cache connectivity lab supplies no application caching guarantee.

## 7. Design challenge: recoverability and a regional incident

**Requirement:** define an RTO/RPO from business needs, survive one declared failure domain, and bound the cost of standby/replicated/retained state. The requirement intentionally gives no numeric target—you must justify one.

Draw normal and recovery dependency graphs: compute, state, DNS, TLS, identities, secrets/keys, artifact access, queues/streams and operational access. Specify replication consistency, writes during partition, backups, restore ordering, cutover, reconciliation and failback.

**Counterexamples:** backup keys unavailable in recovery region; replicated deletion propagates corruption; snapshot and receipt history belong to different cuts; failover permits two write authorities; DNS cache delays cutover; restore command completes before useful application service returns.

**Reference direction:** start with a tested single-region restore and its measured RTO/RPO. Multi-region resources add protocol and operational state; count shared dependencies and authority decisions explicitly. Record quoted cost units and actual restore evidence. No local Boolean path model proves a real regional availability percentage.

## 8. Evaluation rubric

| Dimension | Evidence of a defensible design | Missing reasoning |
| --- | --- | --- |
| State/operations | Exact authority, IDs and lifecycle | Product-name diagram only |
| Permission/path | Caller, action, resource, trust and bidirectional path | “Private” without route/identity explanation |
| Consistency/order | Boundary and ordering scope stated | “Exactly once” without effect/receipt protocol |
| Failure/recovery | Crash trace, retained state and restart behavior | Happy-path deployment only |
| Capacity/cost | Units, limits, bottleneck and quoted assumptions | More replicas assumed to fix every bottleneck |
| Observation | Expected/actual split, raw trace, limitations | Invented timing or success from API acceptance |
| Cleanup | Owned resources and retained-data disposition | Stack deleted assumed to imply zero residue |

Choose the smallest architecture with a counterexample you can explain. Add a service only when a requirement exposes a missing mechanism.
