# Security evidence and scope

Status: draft. Research/validation date: 2026-10-14. Reviewer: pending.

Sources read: [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), January 2025 (OAuth security); [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html), February 2020 (JWT verification context); [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446.html), August 2018 (TLS 1.3); [RFC 6455](https://www.rfc-editor.org/rfc/rfc6455.html), December 2011 (WebSocket); [RFC 9420](https://www.rfc-editor.org/rfc/rfc9420.html), July 2023 (MLS); [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162.html), December 2021 (CT); [PostgreSQL 18 RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html). Protocol properties are separated from application decisions and prior lab behavior.

The threat model, acceptance sequence, cache/scope arguments and worked revocation histories are authored designs. No proprietary security system or production audit is claimed. The CT discussion identifies a distinct transparency protocol; Project G uses an unsigned in-memory hash chain and a supplied anchor, not CT/MLS/TLS implementations.

Project G's expanded suite passed 25 tests on Node 26.7.0 / SQLite 3.53.4. Security-related evidence includes current revocation across read/write/replay, changed payload under an original ID, forged extra scope rejection, mixed schema refusal, tuple-key collision distinction, edited trace/anchored truncation and loopback-only proxy. None proves real token issuance, JWT/TLS, E2EE, end-to-end multitenancy, PostgreSQL RLS deployment, adversarial cryptography or penetration-test completeness. Prior labs use public fixture tokens and trusted local database access.

Review needs: acceptance/disclosure ordering around revocation, scope across caches/brokers/snapshots, outcome retention, credential/tenant derivation, parsing/resource budgets, encrypted-state evidence and independently trusted audit checkpoints. No formal ASD-STE100 or regulatory compliance claim. Consequential security decisions require a technically informed review before ready status.
