# Multiplayer research and validation record

Status: draft. Research began 2026-10-13 and continued through 2026-10-14 local date. Final guide/validation date: 2026-10-14. Reviewer: pending.

## Source quality and limits

The guide's formulas, genre matrix, slot-finality protocol, movement/rollback examples and capacity estimates are authored reference designs. They are not claims about proprietary contemporary games.

Primary technical sources read:

- [Glenn Fiedler, Fix Your Timestep!](https://www.gafferongames.com/post/fix_your_timestep/), June 2004: first-person simulation-loop mechanism and overload; not a universal production tick rate.
- [Snapshot Interpolation](https://www.gafferongames.com/post/snapshot_interpolation/), November 30, 2014, and [Snapshot Compression](https://www.gafferongames.com/post/snapshot_compression/): first-person implementations/examples. The guide does not repeat blanket transport/player-count recommendations as universal truths.
- [GGPO project](https://www.ggpo.net/) and [callback interface](https://github.com/pond3r/ggpo/blob/master/src/include/ggponet.h): deterministic prediction/rollback and save/load/advance obligations. Source inspected by date, not built or linked in Project F; mutable master URLs are not a version-pinned deployed game.
- [Valve Source SDK lag compensation](https://github.com/ValveSoftware/source-sdk-2013/blob/master/src/game/server/player_lagcompensation.cpp): inspected history, timing bounds, rewind and restore code. Narrow source behavior, not a claim about current proprietary Valve games or universal numeric settings.
- [RFC 8085](https://www.rfc-editor.org/rfc/rfc8085.html), March 2017: UDP congestion/message/reliability responsibilities.
- [RFC 8445](https://www.rfc-editor.org/rfc/rfc8445.html), July 2018; [RFC 8656](https://www.rfc-editor.org/rfc/rfc8656.html), February 2020: ICE and TURN roles, not implemented/tested NAT traversal here.
- [RFC 9221](https://www.rfc-editor.org/rfc/rfc9221.html), March 2022: QUIC datagrams. No QUIC/browser implementation test claimed.

The Valve community networking wiki returned 403. Fiedler's deterministic-lockstep page failed fetch. No detailed claim relies on those unread pages; lockstep reasoning is derived under explicit deterministic-state/input assumptions, with GGPO supplying related primary evidence.

## Executed implementation evidence

Node v26.7.0; no external dependencies, databases or containers. The project uses millimetre integer motion, a 50 ms simulation timestep, at most 12 future input slots, two fixture actors and 1,200-byte JSON datagrams. The server's obstacle at 120 mm differs intentionally from the client's free-path bound to expose reconciliation.

Initial 22 tests passed. After bounded retired-nonce bookkeeping plus lost-welcome/revocation regressions, the expanded suite reported 24 passes, zero failures. Tests use:

- Pure core schedules for fixed steps, packet/input identity, finality, missing deadlines, prediction/replay and interpolation.
- A seeded logical scheduler for loss, duplicates, delay/reordering and partition. This is not OS network emulation or measured packet loss on the Internet.
- Actual loopback UDP sockets for input/snapshot exchange, deliberately dropped application datagrams, fixture authentication, endpoint binding, oversized input, replacement sessions, repeated join and revocation.
- An actual server subprocess killed with SIGKILL and a fresh server process for new epoch/rejoin. There is no persistent match; the test verifies reset/fencing rather than recovery of old state.

Demo observed:

```text
predicted before confirmation=150mm
authoritative=120mm; correction=-30mm; pending=0
remote at tick5=50mm
seeded link: sent=10; dropped=3; duplicated=2
```

The demo itself is deterministic logical simulation; real sockets are covered by integration tests. All resources are memory/sockets/processes owned by the lab. Tests close/stop them; no persistent world files are created.

## Correctness boundaries and review needs

An input ACK means slots finalized, including neutral fallback, not packet receipt or durable acceptance. The clock caps catch-up work and drops wall-time debt; presentation time is receipt-anchored and lacks network clock estimation. Snapshot interpolation holds underflow and has no unbounded extrapolation. Explicit join clears old gameplay pending input; it is not offline document replay.

No real Internet congestion control, cryptographic transport, hostile packet-spoof resistance, NAT, relay, full rollback, lockstep, weapons/lag compensation, graphical rendering, continuous held-key sampling, world/economy durability, delta baselines or large interest sets are validated. Static public fixtures and loopback restrictions must remain visible in documentation.

Technical review should inspect timing/finality mapping, stale/duplicate handling, complete-packet validation, replay assumptions, snapshot/epoch validation, disconnect admission and overload policy. Production evidence requires WAN/load/long-session testing, simulation determinism checks where applicable, anti-cheat/privacy evaluation and explicit persistent-state recovery. No formal ASD-STE100 compliance claim.

Final checks (2026-10-14): documented npm test and npm run demo reran successfully: 24 tests passed, zero failures, and all four demo lines matched. A separate spawned CLI exercised right/neutral input, show, explicit reconnect and quit; output showed immediate predicted displacement and a reset pending queue, and the loopback authority received input. Its server/socket were closed. Local paths and balanced fences passed across 40 Markdown documents excluding node_modules; new-file whitespace and git diff --check passed. No persistent game files, external services or containers were created.
