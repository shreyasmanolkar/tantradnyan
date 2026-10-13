# Database evidence and validation

Research date: 2026-10-13. Product claims are bounded to PostgreSQL 18 and Java SE 25 references.

Primary evidence read: PostgreSQL 18 MVCC introduction, isolation, explicit locks, constraints, serialization-failure handling, vacuum, WAL introduction/configuration, standby replication, logical-decoding concepts, logical-replication conflicts and PREPARE TRANSACTION. Each is linked near its relevant guide claim. Ports/Grittner's 2012 original SSI paper supports dependency-based serializable execution. Raft extended 2014 paper supports the distinct replicated-log role. Oracle Java SE 25 AtomicReference/AtomicInteger APIs support local CAS examples.

Version-sensitive distinctions: Read Committed predicate reevaluation, Repeatable Read write skew, SSI whole-decision retry, logical-replication conflicts, prepared-transaction behavior and replication acknowledgment points. Generic terms are separated from PostgreSQL implementation choices. The global sequence/late-commit history is a constructed protocol counterexample, not a vendor incident report.

Actual validation: 2026-10-13, Node.js v26.7.0; isolated container PostgreSQL 18.4. Image `postgres:18.4-alpine`, identity/digest `sha256:9a8afca54e7861fd90fab5fdf4c42477a6b1cb7d293595148e674e0a3181de15`. Settings observed: fsync=on, synchronous_commit=on, full_page_writes=on. Fourteen SQL subtests plus the parent test passed (15 reported tests), zero failures. Java 25.0.1 source-file launch passed all embedded assertions with four threads and 20,000 increments. No global Java setting was changed.

The database tests exercise actual independent psql sessions and inspect lock wait state; they simulate a lost application acknowledgment by discarding a returned result. They do not inject database/power/storage failures or deploy replication/2PC. Trusted test SQL is not a production parameterized driver. A unique test schema is removed after each run; the temporary container and scoped data volume were removed after final validation. Constraint checks and a real deadlock were included in the final run.

Technical reviewer pending. No formal ASD-STE100 compliance claim.
