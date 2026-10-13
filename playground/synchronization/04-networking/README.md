# Networking laboratory: delivery, framing and effect boundaries

Requires Node.js 18 or later; no dependencies. Run from repository root:

```sh
node playground/synchronization/04-networking/demo.mjs
node --test playground/synchronization/04-networking/protocol.test.mjs
```

Directly run `node playground/synchronization/04-networking/protocol.test.mjs` for individual test output. The socket cases bind only `127.0.0.1` on ephemeral ports and close them after each case. Environments that restrict loopback binding must allow these tests explicitly.

```text
04-networking/
  protocol.mjs       framing, bounds, operation identity, memory effects, snapshots
  sockets.mjs        loopback TCP service and bounded UDP retry experiment
  demo.mjs           reconnect, injected loss and stale snapshot outcomes
  protocol.test.mjs  parser edge cases plus real socket scenarios
  README.md          setup, walkthrough, boundaries and hardening
```

Typical demo output (attempt count is observed scheduling behavior):

```text
TCP application ACK: 1; replay on new connection: 1; effects: 1
UDP injected loss: request=true, ACK=true; attempts=3; effects=1
snapshot 12 accepted=true; stale 11 accepted=false; view=new
```

## Mechanisms

`encodeFrame` writes a 4-byte unsigned big-endian **byte length** followed by UTF-8 JSON. `FrameDecoder` waits for a complete frame and parses each independently. Neither a TCP write nor a Node data callback defines a frame boundary. Tests try every split position, including within UTF-8 sequences, plus coalesced and one-byte chunks. A partial EOF, oversized length or invalid encoding is rejected.

`CommandLedger` checks version, bounded identity and integer delta. It couples an effect with its replay result synchronously in memory. Repeating an ID on a new TCP connection returns the original result while that server object survives. A new ledger loses its history. This contrasts with [Project A](../a-versioned-store/README.md)'s transactional database boundary.

`udpRetryScenario` sends one command over actual UDP loopback sockets. Its receiver intentionally discards the first request before processing, then processes the next request but drops its ACK. A repeated identical command returns the cached result, so a third attempt can complete with one effect. Retry waits increase exponentially and the lab caps configuration at five attempts with a base timer no greater than one second. The budget is finite. These are injected application-boundary faults, not measured IP-layer packet loss or a production congestion controller.

`SnapshotTracker` discards old/duplicate sequence numbers in one declared session. It is suitable only for replaceable state where skipped samples are acceptable. It rejects another session and implements no wraparound. Durable edits cannot use “latest sequence wins” to silently skip required operations.

Walkthrough: inspect the framed bytes; reverse parser split points; reconnect with the same operation ID; contrast memory restart; follow request-drop then ACK-drop; finally deliver snapshots 12, 11, 12. Expected effects and parser outcomes are asserted in tests.

## Failure and performance limits

A transport send callback or TCP ACK is not the application ACK returned by `CommandLedger`; that application ACK is still not durable because the ledger is in memory. Timeout/retry exhaustion means unknown completion, not guaranteed absence of an effect. Identity reuse with different payload is rejected. Valid loops that reuse a lost session identity across server restarts remain unsafe.

TCP response buffering pauses reads on backpressure and disconnects beyond a small queued-byte bound. The client's tiny fixture batch is not a streaming production sender. Decoder concatenation on repeated tiny fragments can copy quadratically; use a bounded chunk queue/ring buffer and parse budgets for large workloads. Bound both message sizes and rates; per-frame limits do not bound connection-wide workload.

UDP messages are capped at 1,200 encoded bytes for this lab. That is a conservative chosen budget, not a universal path-MTU guarantee. No fragmentation/reassembly, selective ACK window, adaptive RTT estimator, multi-command ordering, encryption, authenticated peer identity, NAT traversal or Internet-safe congestion control is implemented. Do not deploy this UDP retry helper over the public Internet. The guide explains the missing obligations.

Tests demonstrate finite parser schedules and loopback communication. They do not prove WAN behavior, kernel loss handling, TLS correctness, database durability or large-scale overload recovery. The separate [networking guide](../../../guides/synchronization/07-networking/README.md) covers WebSockets, SSE, polling, QUIC and NAT protocols; these are not claimed as implemented in this lab.

Production hardening: use established secure transports, validate authenticated sessions and epochs, persist acceptance/replay records where needed, bound queues, pace retry/fan-out, provide catch-up/reset cursors, and test real reconnect/process/storage failure boundaries. Project B adds durable WebSocket chat later; Project F adds an authoritative game simulation.

Validation: 2026-10-13, Node.js v26.7.0: demo matched all three lines with three UDP attempts; 13 tests passed, zero failures. Actual TCP/UDP loopback sockets were used and closed afterward; faults were injected in application handlers. The final timeout assertion inspected the server ledger to confirm one effect despite missing acknowledgment; that server-side fact would be unavailable to an actual disconnected client.

Release review: 2026-10-14, Codex (AI technical/editorial review). Status: ready for this exercise's stated scope. [Review and rerun evidence](../../../guides/synchronization/REVIEW.md) record the actual checks; production-hardening limitations above still apply.
