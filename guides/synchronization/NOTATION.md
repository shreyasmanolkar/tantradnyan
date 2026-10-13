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
