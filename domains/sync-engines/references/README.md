# Primary-source reading map

The guide links sources next to the claims they support. This index identifies the next reading task and limits of the evidence. Sources were checked on 2026-10-07; a publication describes its dated architecture, not an assurance that a proprietary service still uses exactly that design. No passages or figures were copied into this curriculum.

## Protocols and platform contracts

| Source | Reading target | Question / boundary |
| --- | --- | --- |
| [DNS concepts, RFC 1034 (1987)](https://www.rfc-editor.org/rfc/rfc1034.html) | §§2–5 | Names, delegation, resolvers and cached records |
| [UDP NAT behavior, RFC 4787 (2007)](https://www.rfc-editor.org/rfc/rfc4787.html) | Mapping/filtering/timers | Peer reachability differs from application identity |
| [IPv6, RFC 8200 (2017)](https://www.rfc-editor.org/rfc/rfc8200.html) | §§3–5 | Address/header/fragmentation and packet sizing; not application reliability |
| [TCP, RFC 9293 (2022)](https://www.rfc-editor.org/rfc/rfc9293) | §2.2; §3 sequence/ACK/connection processing | Reliable ordered bytes; no durable application commit |
| [TCP congestion control, RFC 5681 (2009)](https://www.rfc-editor.org/rfc/rfc5681.html) | §3 | Slow start/congestion avoidance/loss response; one classical family, not every deployed algorithm |
| [TCP retransmission timer, RFC 6298 (2011)](https://www.rfc-editor.org/rfc/rfc6298.html) | §§2–5 | RTT variance, timeout and sampling; distinguish transport retry from semantic retry |
| [UDP, RFC 768 (1980)](https://www.rfc-editor.org/rfc/rfc768) | Header and operation | Datagram boundary with no reliable-order guarantee |
| [UDP usage guidelines, RFC 8085 (2017)](https://www.rfc-editor.org/rfc/rfc8085.html) | §§3.1–3.2 | Congestion control and message sizing obligations |
| [QUIC, RFC 9000 (2021)](https://www.rfc-editor.org/rfc/rfc9000.html) | §§2,4,5 and stream/connection processing | Per-stream order, connection IDs and control; app commit remains separate |
| [QUIC datagrams, RFC 9221 (2022)](https://www.rfc-editor.org/rfc/rfc9221.html) | §§4–5 | Best-effort datagrams sharing a secure connection; no retransmission/fragmentation promise |
| [WebSocket, RFC 6455 (2011)](https://www.rfc-editor.org/rfc/rfc6455) | §§4–5 | Upgrade, masking, length, fragments and control frames; compare toy limitations |
| [SSE, WHATWG HTML](https://html.spec.whatwg.org/multipage/server-sent-events.html) | EventSource parsing/reconnection | Last-Event-ID supports replay only when the application retains history |
| [WebRTC, W3C specification](https://www.w3.org/TR/webrtc/) | RTCPeerConnection and data-channel configuration | Browser negotiation/API semantics; browser support needs target testing |
| [WebRTC data channels, RFC 8831 (2021)](https://www.rfc-editor.org/rfc/rfc8831.html) | §§5–6 | SCTP/DTLS transport, ordering and partial reliability |
| [HTTP/2, RFC 9113 (2022)](https://www.rfc-editor.org/rfc/rfc9113.html) | Streams and flow control | Multiplexed HTTP still shares TCP loss blocking |
| [HTTP/3, RFC 9114 (2022)](https://www.rfc-editor.org/rfc/rfc9114.html) | HTTP/QUIC mapping | Different HTTP carrier, not a synchronization data model |
| [ECMAScript memory model](https://tc39.es/ecma262/multipage/memory-model.html) | Shared memory events and ordering | JavaScript atomic semantics; remote messages are not CPU fences |

These standards specify mechanisms. A small Node socket demo does not reimplement or establish compliance with all their requirements. The handwritten WebSocket subset is explicitly bounded.

## Time, agreement and consistency

| Source | Reading target | Connection to lab |
| --- | --- | --- |
| [Lamport, Time, Clocks, and the Ordering of Events (1978)](https://lamport.azurewebsites.net/pubs/time-clocks.pdf) | Partial ordering and clock condition | Lab 07; causality implication versus converse |
| [Kulkarni et al., Logical Physical Clocks (2014)](https://cse.buffalo.edu/~demirbas/publications/hlc.pdf) | HLC update rules/assumptions | Backward wall-clock input without logical regression |
| [Gilbert and Lynch, CAP result (2002)](https://doi.org/10.1145/564585.564601) | Definitions of consistency/availability/partition | Formal boundary; not an uptime/performance triangle |
| [Fischer, Lynch and Paterson (1985)](https://doi.org/10.1145/3149.214121) | Asynchronous consensus assumptions | Distinguish safety from guaranteed termination |
| [Ongaro and Ousterhout, Raft (2014)](https://raft.github.io/raft.pdf) | §5, log matching/commit/election safety | The quorum toy does not implement these rules |

DOI landing-page retrieval for CAP and FLP was unavailable during source checking; those are bibliographic source pointers, not freshly inspected proprietary implementation evidence. The guide uses standard theorem statements and explicitly declares their models.

## Concurrent editing and replicated data

| Source | Reading target | Connection to lab |
| --- | --- | --- |
| [Ellis and Gibbs, Concurrency control in groupware systems (1989)](https://doi.org/10.1145/67544.66963) | Original transform motivation | Lab 13's positional conflict |
| [Sun et al., Achieving Convergence, Causality Preservation, and Intention Preservation (1998)](https://doi.org/10.1145/274444.274447) | Separate consistency requirements | Pair convergence alone does not prove editor correctness |
| [Sun and Ellis, Operational transformation in real-time group editors (1998)](https://doi.org/10.1145/289444.289469) | Transformation/control requirements | Context, inclusion/exclusion and path conditions |
| [Shapiro et al., comprehensive CRDT study, INRIA RR-7506 (2011)](https://inria.hal.science/inria-00555588) | State/operation sufficient conditions | Original research-report pointer; direct PDF fetch was unavailable |
| [Shapiro et al., Conflict-free Replicated Data Types (2011)](https://inria.hal.science/inria-00609399) | Formal convergence treatment | Bibliographic paper pointer; archive returned access challenge |
| [Preguiça, CRDT overview (2018)](https://arxiv.org/abs/1806.10254) | Application/system/developer distinctions | Merge semantics versus application constraints |
| [Almeida, Approaches to CRDTs (2023)](https://arxiv.org/abs/2310.18220) | State and operation models/variations | Derive delivery and algebra assumptions |
| [Almeida, Shoker, Baquero, Delta State Replicated Data Types](https://arxiv.org/abs/1603.01529) | Delta groups and causal conditions | Sparse counter states differ from relative patches |
| [Bieniusa et al., An optimized conflict-free replicated set (2012)](https://arxiv.org/abs/1210.3368) | Observed-remove semantics and metadata | Toy retains tombstones; optimized context requires more protocol |
| [Roh et al., Replicated abstract data types (RGA, 2011)](https://doi.org/10.1016/j.jpdc.2010.12.006) | Identity/order in replicated sequences | The text toy is RGA-like, not the full published algorithm |

Some DOI full texts were not retrievable through browsing. They are reading targets, not copied implementation sources or assertions of exhaustive review. Open original texts before implementing an unrestricted transform control algorithm or reproducing a research algorithm exactly. The handwritten models declare their own rules and bounded tests.

## Durability and application systems

| Source | Reading target | What the evidence establishes |
| --- | --- | --- |
| [PostgreSQL 18 transaction isolation](https://www.postgresql.org/docs/18/transaction-iso.html) | Write skew, snapshot behavior and serializable retry | One specific engine's isolation contract |
| [PostgreSQL 18 logical decoding](https://www.postgresql.org/docs/18/logicaldecoding-explanation.html) | Change extraction and restart/replay | CDC consumers still need processing/checkpoint semantics |
| [AWS Builders' Library: idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) | Caller request identity and late retries | Stable identity prevents repeated semantic effects within a defined scope |
| [Tridgell and Mackerras, rsync algorithm (1996)](https://rsync.samba.org/tech_report/) | Rolling checksum and matching blocks | Delta byte transfer; not automatic semantic file conflict merging |

## Dated product accounts

| Account | Confirmed scope | Do not infer |
| --- | --- | --- |
| [Google's collaboration series, September 2010](https://drive.googleblog.com/2010/09/whats-different-about-new-google-docs_21.html) | Historical character collaboration and OT discussion | Current exact transform, transport, persistence or regional protocol |
| [Figma multiplayer, October 2019](https://www.figma.com/blog/how-figmas-multiplayer-technology-works/) | Described centralized document/property synchronization | That every current feature uses one CRDT or the old routing/process design |
| [Linear delta read path, August 2026](https://linear.app/now/rebuilding-delta-sync-read-path) | Workspace action logs, checkpoints, filtering and lag-safe read serving | Every write conflict policy or every document editing mechanism |
| [Linear scaling talk page, 2023](https://linear.app/now/scaling-the-linear-sync-engine) | A company presentation entry point | An inspected video transcript; no such transcript was reviewed here |
| [Slack real-time messaging, 2023](https://slack.engineering/real-time-messaging/) | Gateway/channel-server routing and realtime fanout | Every database transaction or history-recovery detail |
| [Discord message storage, 2023](https://discord.com/blog/how-discord-stores-trillions-of-messages) | Message storage/partitioning/data-service architecture | The complete live sync or voice networking stack |
| [Valve Source Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking?language=uk) | Published prediction/interpolation/lag-compensation principles | Every game/version or a universal tick-rate recommendation |
| [GGPO project account](https://www.ggpo.net/) | Rollback approach for games | That the lab implements the SDK's complete scheduler/protocol |

Notion-like editors, whiteboards, multiplayer code editors, dashboards and scale-band designs in the guide are expressly **proposed architectures**. Company accounts are paraphrased narrowly; no throughput chart was transcribed or converted into a lab measurement.

## Source-reading exercise

Choose one paper or open implementation. Record an exact edition/revision, one relevant state structure, its transition function, invariant, delivery/clock assumptions and a counterexample prevented by the rule. Compare it with the toy. A link to a repository's moving default branch is not a pinned source walkthrough.
