# Shared notation and assumptions

- Actors: Mira (`M`), Dev (`D`), server (`S`); replicas `R₁ … Rₙ`.
- A logical object has stable ID `objectId`; a replica is a copy, not another object identity.
- `s` is one replica's state. `o` is an operation. `apply(s,o)` is its specified transition. `s₀` is the agreed initial state.
- `H` is a history of invocations, responses, sends, receives and crashes. `Uᵢ` is the set of updates incorporated by replica `i`.
- `a → b` means happened-before; `a ∥ b` means neither causally precedes the other.
- `L(a)` is a Lamport timestamp; `V(a)` is a vector timestamp. `≤` on vectors means componentwise comparison, not lexicographic comparison.
- `v` is a record version. `seq` is a sequence in a declared log/stream scope. `epoch` distinguishes authority generations. None is interchangeable with a wall-clock time.
- `opId = (replicaId, counter)` is an example identity; a real client must persist its counter and avoid reusing an identity after restore. UUIDs are another option, not a causal clock.
- `merge(x,y)` reconciles replicated states; `T(o,p)` transforms an operation against another operation. Their contracts differ.
- `I(s)` is a domain invariant, such as nonnegative stock. `≈` means equality of observable logical state, allowing different internal encodings.
- `RTT` is round-trip time; `λ` is arrival rate; `μ` is service capacity. Equations define units locally.

Default failure model: crash/restart nodes, loss/delay/duplication/reordering of application messages, partitions and unsynchronized clocks. Eventual delivery is an additional liveness assumption, never an automatic property. Malicious actors are discussed separately; a crash-tolerant proof does not cover Byzantine behavior.

Examples using positions initially count ASCII characters. Later text guides must state UTF-16 code units, Unicode scalar values or grapheme clusters explicitly. A cursor offset has no meaning without a document version and indexing convention.

Chapter-local mathematical symbols are defined at each equation: mean occupancy `L` differs from Lamport timestamp `L(a)`; queue utilization `ρ` differs from a clock's fractional drift bound. Durations use seconds unless a section explicitly states milliseconds. `r` can denote RTT in a network equation or participant count in a complexity analysis; each use declares its meaning.

Conflict-guide branches: `B` is the common base, `L` the local branch, and `R` the remote branch. Missing own fields represent deletion only in a full-branch comparison; omission in a patch does not have that meaning. Lab values are finite JSON scalars; structured text/maps need specialized algorithms.

OT notation: `I(p,x,id)` inserts one atom at gap p, `D(p,id)` deletes the original atom at p, and `N(id)` retains an identity with no effect. `T(a,b)` expresses a in a context containing concurrent b. Both operands must have appropriate equivalent original contexts. The OT lab uses printable ASCII atoms; its signature is not a general editor.

CRDT notation: `x ⊔ y` is a join under a declared information order. A dot `(actor,counter)` identifies a write in one object/generation; include that scope in real envelopes. The MV context denotes causally closed actor prefixes, not arbitrary maximum packet counters. Sequence IDs carry an actor and Lamport clock; their clocks are not the MV register's per-actor assignment counters. A writer incarnation must be exclusive and must not roll back/reuse its identity. The sequence lab stores one Unicode scalar per node, not one grapheme.

Database notation: a returned row inside an open transaction is provisional until commit. A per-record version orders accepted changes for that object/generation; a PostgreSQL sequence allocation is not a global commit cursor. LSN denotes a WAL location and needs a commit-aware stream/checkpoint contract before use as an application resume boundary. SQLSTATE identifies a database error class such as `40001` or `40P01`. Bigint API values/versions use decimal strings where JavaScript integer precision would otherwise be lost.

Networking notation: byte-stream frames, IP packets, UDP datagrams, operation IDs and application cursors have separate scopes. A connection/session generation can fence ephemeral traffic while the same logical operation identity survives reconnect. ACK labels must name receipt, memory effect, durable commit or application checkpoint. Networking lab frame lengths count UTF-8 bytes; UDP messages have a chosen 1,200-byte bound, not a universal MTU guarantee.

## Messaging identity and progress

Project B uses `opId` for a logical submission across retries, `requestId` for one RPC correlation, `messageId` for accepted content, and `(channel, epoch, seq)` for stream location. Sequences are bigint values serialized as decimal strings; order comparisons remain numeric. The server's sent cursor, the client's applied checkpoint and a page's source high-water boundary denote different facts. An acceptance ACK alone advances none of the client's stream projection.

## Offline state and incorporation

Project C distinguishes confirmed projection `B`, applied cursor `c`, ordered pending intents `P` and retained outcomes/conflicts `R`. Pending accepted operations remain active until the installed confirmed prefix covers their accepted sequence. A snapshot must reconcile original pending identities at the same boundary to avoid double overlay. `dependsOn` names a predecessor outcome in the same actor/authority epoch, not just a matching version number. The lab bounds numbers to JavaScript safe integers, unlike Project B's bigint decimal-string protocol; production protocols must choose explicit ranges.

## Collaborative editor boundaries

Project D distinguishes Yjs internal item/client clocks, authenticated actor/session, an exact binary blob's SHA-256 ID and the server's durable acceptance sequence. A blob ACK certifies retained bytes/snapshot, not that missing dependencies integrated or every peer applied them. Y.Text offsets count UTF-16 units; relative positions resolve against a specific compatible Y.Doc. Transaction origins identify local editor/undo versus remote provider changes. Equal insertion state vectors do not alone prove deletion evidence matches.

## Multiplayer timeline and finality

Project F uses server tick `k`, fixed timestep `Delta=50 ms`, session start tick `b`, and input slot `q` assigned to tick `b+q`. Its `ack=k-b` finalizes slots, including missing slots executed as neutral; it is not packet receipt or disk durability. Datagram `packetSeq`, input `seq`, match epoch, actor session and render sample time have distinct scopes. Motion uses integer millimetres; interpolation can yield fractional display positions. Pending game input expires under this timeline instead of replaying indefinitely like offline document work.

## Shared-memory access and histories

Local Java CAS compares the actual AtomicReference identity, not record equals. A State value/version pair is immutable and published through one cell. Java happens-before is a language/runtime observation relation, distinct from message-carried causal metadata. In the local lab a recorded history has invocation/response ordinal markers and old-counter return values; its checker covers completed increment calls only. A stamp distinguishes reference history but needs coherent pair capture and a wrap/reuse policy.

## Trust, ownership and fault evidence

Authorization scope is a tuple such as `(tenant, object, actor, epoch, opId)` whose exact fields follow the protocol. Encoding the tuple without collisions does not authorize it. Owner epochs fence obsolete writers; authority/source epochs also identify history continuity, with distinct semantics. Project G uses virtual scheduling time for reproducible traces and OS time only for bounded integration waits. A journal anchor is `(seq, hash)` retained independently of the checked trace; an unsigned hash chain alone cannot authenticate its author or expose a valid truncated prefix.

Release status: ready. Reviewed 2026-10-14 by Codex (AI technical/editorial review). Open issues: none blocking the stated reference scope. See [completion review](REVIEW.md).
