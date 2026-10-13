# Networking evidence and validation

Research date: 2026-10-13. Protocol statements reference their original specifications, not product marketing or undocumented proprietary behavior.

Primary evidence opened: RFC 9293 (TCP, August 2022); RFC 768 (UDP, August 1980); RFC 8200 (IPv6, July 2017); RFC 5681 (classic TCP congestion mechanisms, September 2009); RFC 6298 (RTO, June 2011); RFC 8085 (UDP guidelines, March 2017); RFC 8899 (datagram PLPMTUD, September 2020); RFC 6455 (WebSocket, December 2011); RFC 8441/9220 (HTTP/2 and HTTP/3 WebSocket bootstrapping, September 2018/June 2022); RFC 9000/9221 (QUIC streams and datagrams, May 2021/March 2022); RFC 8446 (TLS 1.3, August 2018); RFC 8489/8445/8656 (STUN/ICE/TURN, February 2020/July 2018/February 2020).

WHATWG HTML SSE and WebSockets standards were opened as living specification snapshots dated by access, 2026-10-13. Node net/dgram official documentation was consulted as current API documentation, not a claim the host runs the web page's newest runtime. Some version-specific Node pages failed; accessible official latest documentation was used for stable APIs and host version was measured separately.

The packet header table, framing scheme, retry-loss timeline, snapshot tracker and reconnect trace are authored illustrative protocol designs. The 1,200-byte datagram limit is a chosen lab budget, not a universal path-MTU fact. The UTC/time/latency models are cross-referenced rather than repeated as unexplained formulas.

Validation: 2026-10-13, Node.js v26.7.0. Demo produced all three documented lines with three UDP attempts. Thirteen tests passed, zero failures. TCP/UDP cases used actual ephemeral loopback sockets. Parser cases controlled splits/coalescing independently; UDP faults were injected in application handlers, not the kernel or WAN. All sockets closed on completion. The final lost-ACK timeout case inspected the server memory ledger and confirmed one effect even though the client failed to receive acceptance evidence.

No TLS/QUIC/WebSocket/SSE/NAT implementation tested. No durable storage in this lab; Project A is the separate database-boundary implementation. Finite retry exhaustion means unknown completion. No performance measurements or Internet-safety claims. Release review: see ../REVIEW.md; no formal ASD-STE100 compliance claim.

## Release review — 2026-10-14

Current status: ready for the stated educational scope. Reviewer: Codex (AI technical and editorial review); no independent human review claimed. Historical research/execution notes above retain their original scope and do not imply every cited full text was newly fetched. The [review record](../REVIEW.md) supersedes earlier pending-review/planned-work statements; [VALIDATION.json](../VALIDATION.json) records this release's actual reruns.

Open issues: none blocking this educational release. Scope limits and further validation: Real loopback TCP/UDP examples; no Internet congestion, TLS/QUIC/NAT or MTU deployment validation.
