---
title: "Messaging: durable history, live delivery and ephemeral state"
status: draft
audience: "Engineers building channel-based real-time applications"
last_reviewed: 2026-10-13
technical_scope_as_of: "Project B; PostgreSQL 18.4, Redis 7.4.3, Kafka 4.1 design documentation; RabbitMQ 4.3 documentation"
reviewer: pending
open_issues: "Technical review; production load, broker failover, client persistence and regional deployment not validated"
---

# Messaging: durable history, live delivery and ephemeral state

## 1. Reader, scope and questions

You understand [transactions](../06-database-concurrency/README.md), [transports](../07-networking/README.md) and the [engine lifecycle](../08-sync-engine/README.md). You need to design durable chat, distinguish broker guarantees from user-visible outcomes, and recover history after disconnection.

This chapter answers: what becomes authoritative; what is ordered; which acknowledgment proves which boundary; how do consumers survive retries; how does live delivery meet historical catch-up; what can be discarded; and how do fan-out, presence, receipts and overload alter the design?

The reference architecture is an authored design. It describes Slack- and Discord-style requirements without claiming either product uses this implementation. [Project B](../../../examples/synchronization/b-durable-chat/README.md) supplies runnable WebSocket, PostgreSQL and Redis code. Full offline client persistence belongs to Project C; games need a simulation protocol beyond the delivery distinctions explained here.

## 2. Begin with the state, not the socket

A channel is a permission boundary and a logical conversation. Its stored messages need stable identities independent of transport connections. Membership determines who may submit and read. The server, not a supplied author field, binds an authenticated identity to a submission.

Separate these kinds of state:

| State | Useful representation | Concurrent-operation policy | Recovery requirement |
|---|---|---|---|
| Message creation | Immutable ID, channel, author, accepted sequence, body | Deduplicate original operation; append once | Retained history |
| Message edits | Message ID, revision, replacement or text operations | CAS for whole-body edits; OT/CRDT if shared editing is intended | Latest revision plus required change history |
| Deletion | Authorized tombstone/redaction and revision | Specify delete-versus-edit precedence | Propagate removal; stop redisclosing old content |
| Reactions | Membership of `(message,user,emoji)` | Idempotent add/remove or specified observed-remove policy | Durable set/projection |
| Membership | Role and policy generation | Authoritative transaction | Current authorization, including reconnect |
| Read receipt | User/channel and acknowledged eligible boundary | Monotonic update within a generation | Durable if cross-device unread state matters |
| Typing | Session, channel, expiry | Latest valid session update; expire | Usually no historical replay |
| Presence | Session leases and user aggregate | Multiple active devices; expire stale sessions | Rebuild from current leases |

A message edit is not automatically a collaborative text edit. Choosing revision-CAS intentionally rejects one stale replacement; choosing a text CRDT intentionally retains concurrent editing evidence. A reaction is not an increment: duplicate deliveries of `addReaction` must not create duplicate membership.

Project B implements immutable creation and channel membership only. These additional rows are design choices, not hidden lab features.

## 3. Ordering: define its scope and purpose

Mira submits A and Dev submits B independently. Physical timestamps can disagree; their submissions are concurrent until a shared authority chooses an order. For a channel, the authority may assign A sequence 7 and B sequence 8. That order determines pagination and replay; it does not prove Mira acted earlier in physical time.

A UUID identifies a message. A channel sequence orders accepted entries. A request ID correlates one network response. An operation ID identifies a logical submission across retries. A stream epoch distinguishes a recreated stream from the old stream with the same name. None substitutes for the others.

Project B locks the channel counter row inside the message transaction. The next writer waits until the earlier transaction commits or rolls back. Message, sequence allocation, retry outcome and outbox row commit together. Rollback returns the counter update too. Therefore the committed head describes a contiguous prefix in this particular schema. A generic database sequence allocated outside rollback semantics does not establish that property.

Global order across every channel would add coordination without helping most channel reads. Cross-channel dependency may instead travel as an explicit reference. Broker partition order also needs an application scope: choose a channel key if channel-local ordering matters; parallel handling inside a consumer can still reorder completed effects. [Kafka 4.1 design](https://kafka.apache.org/41/design/design/)

## 4. Follow one message through its acknowledgment boundaries

```mermaid
sequenceDiagram
  participant M as Mira client
  participant A as Authority
  participant D as PostgreSQL
  participant P as Outbox publisher
  participant R as Redis
  participant G as Dev gateway
  participant C as Dev client
  M->>A: submit(opId, channel, body)
  A->>D: transaction: authorize, dedup, append, outcome, outbox
  D-->>A: COMMIT
  A-->>M: accepted(messageId, sequence)
  P->>D: read committed unpublished outbox
  P->>R: publish channel wake-up
  R-->>G: hint
  G->>D: authorized history after sent cursor
  D-->>G: ordered page
  G-->>C: page(epoch, entries, nextCursor)
  C->>C: validate and apply contiguous page
  Note over P,D: Mark published after publishing; crash can repeat hint
```

The submit ACK proves acceptance under the database's configured durability assumptions. It proves neither recipient delivery nor recipient storage. A successful socket send may mean bytes entered a buffer. A recipient application ACK can mean projection applied, persisted, displayed or explicitly read; the protocol must say which.

RabbitMQ publisher confirms and consumer delivery acknowledgments cover different broker relationships. A publisher confirm does not certify that a recipient processed the message. [RabbitMQ 4.3 acknowledgment guide](https://www.rabbitmq.com/docs/confirms)

These are separate failure boundaries:

| Failure window | Evidence remaining | Recovery |
|---|---|---|
| Authority dies before commit | No accepted row/outcome | Retry same operation ID |
| Commit succeeds, submit ACK lost | Original durable result | Retry returns that result after current authorization |
| Commit succeeds, publisher has not run | Outbox row | Publisher resumes scanning |
| Publish succeeds, published marker absent | Unpublished row remains | Publish again; repeated hints must be harmless |
| Hint disappears or recipient is offline | Authoritative history | Catch up from applied checkpoint |
| Page sent, recipient crashes before applying | Server sent cursor is insufficient | Resume from recipient's last applied durable checkpoint |

Do not fix the publish/mark window by marking first. That introduces a crash window where an entry is marked but never published. The safe policy depends on what publication means: a repeated wake-up is harmless, while a repeated payment or email needs its own effect identity and outcome contract.

## 5. Broadcasts, queues and retained streams solve different problems

A transient broadcast reaches current subscribers. A work queue distributes processing responsibility; acknowledgment and redelivery govern unfinished deliveries. A retained stream preserves ordered records for consumers to reread from positions. Each can carry the same JSON while providing different recovery behavior.

Redis Pub/Sub is at-most-once delivery to subscribers and does not replay missed notifications. Project B therefore publishes only a channel hint and always reads content from PostgreSQL. Duplicate application publications remain possible even though Redis itself does not retry a missed Pub/Sub delivery. [Redis Pub/Sub documentation](https://redis.io/docs/latest/develop/pubsub/)

For a worker queue, declare durable queue/message settings, replication and confirmation rules, prefetch, retry/dead-letter policy and poison-message handling. Do not indefinitely requeue an invalid payload: it consumes capacity while never making progress. For a retained stream, declare retention, partition key, consumer offset storage and what happens when an offset expires. The broker choice cannot supply these application decisions implicitly.

### Idempotent consumer with a transactional inbox

Suppose a worker receives event `e17` twice and adds its amount to a database total. `UPDATE total = total + amount` alone is not idempotent. Within one database transaction:

```text
BEGIN
insert inbox(event_id=e17) with unique constraint
if newly inserted: apply effect to total
COMMIT
acknowledge broker delivery
```

The uniqueness check and effect must share the transaction. A crash before commit leaves neither; a crash after commit but before broker ACK causes redelivery, and the unique key suppresses the repeated effect. A standalone inbox write followed by a separate effect write has a crash gap. An external email/API call is outside this atomic database boundary; use a cooperating idempotency key, a reconciled outcome, or explicitly accept ambiguity.

Kafka transactions can bind Kafka output and consumer offsets for appropriate Kafka-to-Kafka processing. Extending this to an external database requires that destination to cooperate with the output/offset commit boundary. “Exactly once” must name the counted effect and failure assumptions. [Kafka 4.1 delivery semantics](https://kafka.apache.org/41/design/design/)

Consumer groups distribute partitions among workers, rather than broadcast every record to every worker in the same group. Reassignment can leave an old worker with in-flight work. Partition ownership and output-side fencing or transactional identity must prevent obsolete work from corrupting the result. Distinct groups can maintain independent projections. More workers than partitions do not create more partition-parallelism.

## 6. Historical catch-up and live delivery must meet without a gap

Consider a client at sequence 12. Querying history and only then registering live delivery can miss sequence 13 committed between those actions. Registering first and then querying can deliver duplicates. Prefer a protocol where notifications only trigger another authoritative query: duplication becomes harmless and a missing hint is repaired by bounded periodic polling.

PostgreSQL documents an analogous LISTEN startup rule: commit registration, inspect current state in a new transaction, then rely on notifications. Project B uses Redis plus periodic database queries rather than LISTEN. [PostgreSQL 18 LISTEN](https://www.postgresql.org/docs/18/sql-listen.html)

A history page carries an epoch, a starting cursor, entries, a high-water boundary, a next cursor and whether more entries remained in that read. The client validates the channel/epoch and contiguous order before advancing its applied checkpoint. A high-water boundary is evidence about that read's snapshot, not permission to skip entries. Project B uses a repeatable-read transaction for each page; subsequent pages can observe a later head without skipping earlier entries.

Store bigint sequences as decimal strings on the wire, compare numerically and sort the database bigint column. A real lab defect made `ORDER BY seq` refer to the output alias of `seq::text`; it yielded 1, 10, 11, ... before 2. `ORDER BY m.seq` resolves the source bigint. PostgreSQL's alias rules explain this behavior. The 23-message test exposes it. [PostgreSQL 18 ordering](https://www.postgresql.org/docs/18/queries-order.html)

A filtered stream cannot demand adjacent source sequences if invisible entries are intentionally omitted. It needs a scan-progress cursor distinct from delivered-message count, plus a policy generation when filters or permissions change. A retention floor or changed epoch requires an explicit reset/rebootstrap path. Project B rejects invalid/expired cursors; it does not implement snapshot reset or actual history pruning.

Membership must be rechecked during catch-up and outcome replay. A deduplicated result containing message content is still a disclosure. Permission revocation cannot retract bytes already copied to a device, but it must stop subsequent unauthorized reads and mutations at the declared enforcement boundary.

## 7. Fan-out and read paths

Fan-out on write materializes delivery/inbox references when a message arrives. This moves work toward producers and makes per-user reads cheap. Fan-out on read stores one canonical message and merges channel histories when a user reads. This moves work toward queries and can make unread aggregation expensive. A hybrid may eagerly notify active sessions while retaining canonical history for everyone.

For an illustrative capacity estimate, let arrival rate `a=20` messages/second, recipients `n=5,000` per message and serialized event size `b=400` bytes. Assuming every recipient receives one full event, no compression and no protocol overhead, delivery rate is `a*n=100,000` events/second and payload egress is `a*n*b=40,000,000` bytes/second, about 40 MB/s. The multiplication counts deliveries, not distinct stored messages. Real subscription overlap, framing, encryption, slow consumers and retries change it.

Write-time inbox references of 32 bytes would consume `20*5,000*32=3.2 MB/s` before indexes, replication or retention. References reduce storage compared with body duplication but do not remove fan-out work. For a large public channel, one channel log with lazy catch-up may fit better; for individualized feeds, materialized references may simplify access control and ranking. Measure read/write distribution and tail latency before choosing.

Project B is intentionally inefficient at scale: every connected client periodically queries the database, and each gateway scans the shared outbox. A production reader can coalesce one authorized channel fetch per gateway, retain a bounded page cache, wake only gateways hosting subscribers and lease publisher work. Cache reuse must not accidentally cross membership or tenant boundaries.

## 8. Presence, typing and receipts

Presence is an observation derived from liveness evidence, not proof that a human is available. A client can be asleep, partitioned or unable to render while a transport remains alive. Assign a session ID/generation; renew a server-controlled lease through authenticated heartbeats. Aggregate a user as online while at least one eligible session lease is valid. An old session's delayed disconnect must not clear a newer session.

Example: renew every 10 seconds, expire after 35 seconds. Under the chosen server clock and scheduling assumptions, an abrupt departure can appear online for approximately 35 seconds after its last renewal. This is a policy example, not a universal failure-detection bound: scheduler pauses or delayed processing can extend observed removal. Lease expiry favors cleanup; a network partition can falsely report offline. Keep the UI interpretation modest.

Typing indicators should expire independently, be coalesced/rate limited, and not be replayed days later as current activity. Latest-state presence can overwrite older unsent presence. Durable messages cannot use that policy because distinct message IDs carry distinct user work.

A read receipt is a user/client assertion of a defined boundary. It does not prove attention or comprehension. A monotonic read boundary works only when the user was shown a qualifying prefix; jumping to a search result does not necessarily mark every skipped message read.

### Unread count worked example

Assume channel sequences 1–5, read boundary 2, the current user's own message at 3, a deleted message at 4 and another author's visible message at 5. The unread count is 1, not `5-2=3`.

More generally define `r` as the read boundary, `h` as the current evaluated head, and `E_u(s)` as 1 if sequence `s` is an unread-eligible visible message for user `u`, otherwise 0. Then:

```text
unread(u,r,h) = sum E_u(s), for r < s <= h
```

This is counting, assuming one relevant entry per sequence and a policy evaluated at a coherent snapshot. Edits, removals, membership changes, per-thread read boundaries and muted channels can change eligibility. A materialized count must update transactionally or tolerate/reconcile projection lag. A delivery ACK alone must not mark read.

## 9. Compare four delivery paths

| Item | Submission and authority | Delivery and recovery | Overload behavior |
|---|---|---|---|
| Durable message | Authenticated append, stable ID, committed result | Live hint plus retained catch-up | Preserve accepted history; reject/queue new work within limits |
| Typing indicator | Authorized channel/session, expiry | Best-effort current subscribers | Coalesce/drop expired state |
| Presence renewal | Authenticated session lease | Current-state projection and expiry | Bound renewal load; tolerate false-offline interpretation |
| Game movement input | Sequenced input, tick, authoritative validation | Timely processing, selective resend/redundancy, simulation ACK | Reject stale/invalid inputs; newest state does not replace every causal input |

TCP/WebSocket can carry all four, but ordered reliable byte delivery can delay newer data behind retransmission. UDP requires application identity, security, congestion and any chosen reliability. Game input loss policy depends on simulation semantics, not simply “movement is ephemeral.” See [networking](../07-networking/README.md); prediction and replay are covered in the planned multiplayer chapter.

## 10. CQRS and event sourcing: optional, explicit choices

Separating command handling from query models is CQRS. Keeping an append-only domain event history as the canonical basis for reconstruction is event sourcing. A chat database with immutable messages and an outbox is not automatically a fully event-sourced application: membership, edits and other current state may have separate canonical records. Neither pattern requires the other. [Microsoft CQRS](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs), [event sourcing](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing)

A separate search/unread projection introduces lag. Carry its applied checkpoint, distinguish that checkpoint from source head, and make rebuilds restartable and idempotent. If a projection processes event 18 then stores checkpoint 19 without applying 19, recovery silently skips an effect. If it applies 19 and fails before checkpointing, replay repeats an effect unless projection updates are idempotent or transactional with the checkpoint.

Redaction, legal retention and encrypted payload evolution complicate immutable histories: retaining an old event can retain content that a current projection hides. Define physical retention and access to archives separately from UI deletion. Do not promise erasure merely because a tombstone exists.

## 11. Runnable walkthrough and failure diagnosis

Follow [Project B setup](../../../examples/synchronization/b-durable-chat/README.md): start the isolated database/broker, install pinned dependencies, initialize `chat_demo`, start the gateway and open Mira and Dev clients. Use `npm run demo` for reproducible submission/replay/offline catch-up; `npm test` runs real gateway subprocess failures.

Critical functions are `repository.submit` (transactional acceptance), `repository.page` (authorized ordered catch-up), gateway `pump` (serialized per-socket pagination), `publishPending` (repeatable hint publication), and client `projectPage` (validate before checkpoint advance). The README explains source paths and protocol fields.

Expected demo evidence: committed sequence 1; same-ID replay returns the same message; after reconnect from 1, only missing sequence 2 is received; database message count is 2. Variation: suppress publication. Periodic database polling still repairs delivery, proving the hint is not the source of truth.

| Symptom | First evidence to inspect | Recovery/design correction |
|---|---|---|
| Duplicate stored messages | Actor/op ID and durable outcomes | Stable IDs; claim and effect in one transaction |
| Message committed but not visible | Outbox state, subscriber state, applied cursor, permissions | Retry hint/catch-up; distinguish revoked access from lag |
| Stalled after a page boundary | Numeric source ordering and cursor checks | Sort bigint source; reject malformed page without cursor advancement |
| Wrong unread badge | Eligibility policy and projection checkpoint | Recompute from canonical visible history |
| Ghost presence | Session generation and expiry | Fence old renewals; expire leases |
| Slow consumer exhausts memory | Queued bytes, event age, drain rate | Bound buffers; disconnect and resume durable stream |
| Reconnect burst overloads DB | Retry attempt distribution and catch-up pages | Jitter reconnects, limit admission, bound page work |

The lab has 16 reported passing tests including its parent test. It tests actual SIGKILL before commit and after commit/before ACK, two gateway processes, duplicate IDs, 23-message pagination, offline catch-up, revoked access, bad cursors and repeated hints. It does not test host power loss, broker restart, WAN behavior, TLS deployment or persistent client storage. [Validation record](RESEARCH.md)

## 12. Security, operation and invariants

Production authentication must validate a real session/token and derive the actor and tenant server-side. Check membership on submission and history reads; define concurrent-revocation ordering. Never accept an authoritative author or tenant from client JSON. Bound body size, decoded frames, subscriptions, request queues and socket buffers. Log identities/checkpoints and error classes while minimizing private bodies and credentials.

Use TLS and appropriate browser Origin checks. Origin is not user authorization; non-browser clients can choose headers. End-to-end encryption moves plaintext validation/search/moderation away from a blind server and makes membership-key changes a separate protocol. A secure group key protocol does not itself order chat history or enforce application merge semantics. [MLS, RFC 9420, July 2023](https://www.rfc-editor.org/rfc/rfc9420.html)

Observe commit latency, outbox age, source-to-applied lag, rejected cursor counts, reconnect rate, duplicate-op rate, queued bytes and history-query load. Do not equate a healthy socket count with coherent clients. During rolling upgrades, preserve operation fingerprints and cursor meaning; incompatible clients need an explicit upgrade or reset path.

Chapter invariants:

1. Acceptance binds authorized actor, stable operation identity and committed message atomically.
2. Every declared cursor has a scope, epoch, ordering type and retained boundary.
3. Publication success does not imply recipient application or reading.
4. Missed transient delivery cannot erase retained accepted history.
5. Client checkpoint advancement follows validated application, and durable claims require local persistence.
6. Revocation gates subsequent disclosure as well as writes and replayed outcomes.
7. Ephemeral state expires; durable user work recovers through a log or equivalent history.

Status remains **draft** pending technical review. Production capacity and recovery guarantees require measurements and fault testing beyond this loopback lab.
