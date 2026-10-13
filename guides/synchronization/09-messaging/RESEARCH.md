# Messaging evidence and validation

Status: ready (educational evidence record). Evidence checked 2026-10-13. Reviewer: Codex (AI technical/editorial review), 2026-10-14.

## Evidence boundaries

The architecture is an educational reference design. No proprietary Slack, Discord or other product internals are inferred. Sources establish specific mechanisms; the worked schedules, fan-out estimate and unread policy are authored examples.

- [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html), December 2011: WebSocket protocol, not durable application processing.
- [PostgreSQL 18 LISTEN](https://www.postgresql.org/docs/18/sql-listen.html) and [NOTIFY](https://www.postgresql.org/docs/18/sql-notify.html): registration/transaction behavior and transient notifications.
- [PostgreSQL 18 ORDER BY](https://www.postgresql.org/docs/18/queries-order.html): output-alias ordering explains the measured text-sort pagination defect.
- [Redis Pub/Sub](https://redis.io/docs/latest/develop/pubsub/), current documentation: at-most-once subscriber delivery, no offline replay. Detailed Redis Streams behavior is not asserted; its requested documentation fetch was unavailable.
- [RabbitMQ acknowledgment documentation](https://www.rabbitmq.com/docs/confirms), page identifies version 4.3: publisher confirms versus consumer acknowledgments. RabbitMQ is not installed or tested in this installment.
- [Kafka 4.1 design](https://kafka.apache.org/41/design/design/): partition order and scoped processing semantics. Kafka is not installed or tested.
- [Microsoft CQRS](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs) and [event sourcing](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing): separate design patterns; not universal prescriptions.
- [RFC 9420](https://www.rfc-editor.org/rfc/rfc9420.html), July 2023: MLS group-key security; not a chat history/authorization implementation.

## Executed validation

Project B ran on Node 26.7.0/npm 11.19, PostgreSQL 18.4 and Redis 7.4.3. Dependencies: pg 8.23.1, redis 6.3.0, ws 8.22.0. The suite reported 16 passes (two pure tests, one parent and thirteen integration scenarios). It starts real gateway subprocesses with actual loopback WebSockets and sends SIGKILL on both sides of the commit/ACK boundary. Database fsync, synchronous_commit and full_page_writes were enabled.

The 23-message case initially failed: a cast output alias caused lexical sequence ordering. Qualified bigint ordering corrected it; the complete suite then passed. Publication suppression exercises polling recovery, not broker-stop/restart behavior. Repeated outbox publication exercises duplicate hints, not arbitrary duplicate durable side effects.

Demo output establishes same-ID acceptance replay and missing-history-only reconnect, with two stored messages. These runs do not establish power-loss safety, replicated failover, WAN capacity, automatic Redis reconnection, browser behavior or durable client checkpointing. Tests create and remove their own randomized schemas; the lab's database volume is disposable.

## Review needs

A technically informed reader should review authorization/revocation ordering, sequence-prefix assumptions, retention/reset contracts and explicit acknowledgment vocabulary. Production work needs persistent client state, TLS/authentication, resource/load tests, broker/DB outage tests, rolling-version schedules, retention and backup recovery.

Image identities used: PostgreSQL `sha256:9a8afca54e7861fd90fab5fdf4c42477a6b1cb7d293595148e674e0a3181de15`; Redis `sha256:f773b35a95e170d92dd4214a3ec4859b1b7960bf56896ae687646d695f311187`. Final tests were rerun after authorization-header and qualified outbox-order changes: 16 passes, zero failures.

Cleanup completed after final tests/demo: only `sync-masterclass-chat` containers, network and volume were removed. Local path targets and balanced fences were checked across 31 Markdown documents (excluding node_modules); no errors. `git diff --check` passed.

## Release review — 2026-10-14

Current status: ready for the stated educational scope. Reviewer: Codex (AI technical and editorial review); no independent human review claimed. Historical research/execution notes above retain their original scope and do not imply every cited full text was newly fetched. The [review record](../REVIEW.md) supersedes earlier pending-review/planned-work statements; [VALIDATION.json](../VALIDATION.json) records this release's actual reruns.

Open issues: none blocking this educational release. Scope limits and further validation: Real loopback chat/database/broker; production capacity, broker failover, durable browser clients and regional behavior need further validation.
