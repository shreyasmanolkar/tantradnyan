---
title: "Mathematical foundations for synchronization decisions"
status: ready
audience: "Computer engineers who have read the distributed-state foundation"
prerequisites:
  - "State transitions, retries, causal order and consistency contracts"
  - "Basic algebra, probability and asymptotic complexity"
last_reviewed: 2026-10-14
technical_scope_as_of: "Explicit analytical models; constructed numerical examples, not measured deployments"
asd_ste_reference: "Plain-language principles applied; official issue/dictionary not consulted; no compliance claim"
reviewer: "Codex (AI technical and editorial review)"
review_date: 2026-10-14
open_issues: []
release_scope: "Completed educational guide; see REVIEW.md and chapter scope limits"
---

# Mathematical foundations for synchronization decisions

## 1. What this reference enables

A protocol needs two kinds of arguments: why its histories are correct, and whether it can meet its workload and latency requirements. This reference develops both. The intended reader knows basic algebra but need not know queueing theory or replicated algebra.

Central questions: how many operations can be in flight; where does delay accumulate; when do retries magnify load; how much clock uncertainty is tolerable; what algebra permits reordered delivery; and how much history must be retained? Read the [foundation](../01-distributed-state/README.md) first. Use the [conflict guide](../03-conflict-resolution/README.md) to connect the algebra to user operations.

Each model below defines its scope, variables, assumptions, numerical use and failure boundary. Numbers are invented inputs for worked calculations. They are not vendor benchmarks or universal latency targets. Transport implementations, OT correctness and individual CRDT types receive separate guides. The final worked design combines the models without claiming production readiness.

## 2. End-to-end latency is a path through dependencies

Let `D` be elapsed latency of one serial critical path, in milliseconds. Let `dᵢ` be the duration of dependent stage `i`, and `k` the number of stages:

```text
D = Σᵢ₌₁ᵏ dᵢ
```

Assumption: these stages cannot overlap for this request. The sum follows because each starts after its predecessor ends. In a parallel dependency graph, use the longest dependency path, with actual resource contention included; summing every branch overestimates latency.

For an editor with a pre-established connection:

| Stage | Assumed ms |
|---|---:|
| Capture and local persistence | 4 |
| Wait for outbound batch | 8 |
| Client to server | 25 |
| Server queue | 5 |
| Validation and transaction work | 3 |
| Durable commit wait | 7 |
| Server to remote client | 25 |
| Remote apply and render | 6 |
| Total until remote visibility | 83 |

Local rendering can precede outbound batching; its budget might be 10 ms in this constructed design. The acknowledgment path may also overlap remote fan-out. Name the endpoint of every latency metric. “Edit latency” could mean local render, server acceptance, remote receipt or remote render.

For a batch flushed every `T` milliseconds, a uniformly phased arrival has mean batch wait `T/2` and a maximum approaching `T`. With `T=16 ms`, mean wait is 8 ms. The mean comes from averaging arrival offsets across the interval. This breaks down when arrivals align with frames, size thresholds trigger early flushes, or scheduling pauses delay the timer.

Percentiles of component latencies do not add into the same percentile of the total. A request's slow stages may be correlated, or different requests may dominate each stage. Measure end-to-end distributions and traces rather than adding p99 numbers.

**Decision:** batching is justified when reduced per-message work outweighs its extra wait. A presence indicator and a durable edit can use different budgets.

## 3. Bandwidth-delay product and acknowledgment windows

Let `B` be bottleneck payload capacity in bytes/second, `r` the round-trip acknowledgment delay in seconds, and `F` the bytes allowed in flight. Filling the path for one feedback cycle requires approximately:

```text
F_required = B × r
throughput ≤ min(B, F/r)
```

Assumptions: a steady path, pipelined transmission, acknowledgments that release the window after about one RTT, no startup/loss effects, and enough application data. The sender can send `F` bytes per acknowledgment cycle, yielding `F/r`; the physical path independently caps it at `B`.

Example: 100 Mbit/s is 12,500,000 bytes/s when using decimal units. At 80 ms RTT, the bandwidth-delay product is 1,000,000 bytes. A 64 KiB window permits at most 819,200 bytes/s, about 6.55 Mbit/s, in this model. Larger receive windows are one motivation for TCP window scaling. [RFC 7323, September 2014, §1.1](https://datatracker.ietf.org/doc/html/rfc7323#section-1.1)

An application stop-and-wait protocol also limits throughput. A 200-byte operation awaiting each 80 ms acknowledgment sends only 12.5 operations/s, or 2,500 bytes/s. Batch or pipeline independent operations while retaining operation identity and dependency rules.

The bound does not predict actual TCP throughput: congestion windows, receive windows, pacing, packet loss, ACK behavior, encryption, headers, CPU limits and changing RTT intervene. More in-flight work also increases memory and recovery burden. A large window cannot repair an overloaded server.

**Decision:** separate transport flow control from the application's accepted-operation window. Bytes acknowledged by TCP are not necessarily committed business operations.

## 4. Little's Law: concurrency comes from residence time

Use a precisely defined boundary, such as operations accepted into a server queue until they leave after commit. Let `L` be the long-run mean number inside, `λ` the admitted arrival rate in operations/second, and `W` their mean time inside in seconds:

```text
L = λW
```

The original result states conditions for finite stationary averages; it does not require Poisson arrivals or exponential service times. [Little, 1961](https://pubsonline.informs.org/doi/abs/10.1287/opre.9.3.383)

An intuitive sample-path argument: every completed operation occupies one slot for its residence time. Over a long interval, the area under “number in system” equals the sum of those residence times, aside from boundary work. Dividing by interval duration gives average occupancy, while dividing the completed count by duration gives throughput. Boundary contributions must become negligible. Little's later retrospective discusses the importance of these accounting conditions. [Little, 2011](https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf)

At `λ=2,000/s` and `W=0.075 s`, average in-flight work is 150 operations. If mean residence time rises to 0.300 s at the same admitted rate, occupancy rises to 600. Connections may remain constant while pending work quadruples.

This equation relates averages; it supplies neither a p99 prediction nor a safe maximum buffer size. It also does not prove stability. If arrivals exceed departures indefinitely, finite steady-state averages do not exist. Count admitted work, not offered requests, if requests can be rejected. Include the same population in all three measurements: queue-only waiting and total service residence are different boundaries.

**Decision:** use a concurrency limit with bounded admission and measured residence time. Do not simply enlarge queues whenever latency rises.

## 5. Why queues grow and tails deteriorate

### 5.1 A fluid overload calculation

Let `Q₀` be the initial queued operation count, `λ` a constant arrival rate, `μ` a constant service capacity, both in operations/second, and `t` elapsed seconds. While the queue remains nonempty:

```text
Q(t) = Q₀ + (λ − μ)t
```

This follows by counting arrivals minus departures. If `λ<μ`, clip the formula at zero and account separately for idle time. It ignores discreteness, service variance and multiple priority classes.

At arrivals 1,200/s and service 1,000/s for two seconds, an empty queue grows to 400 operations. If it stores 1 KiB per operation, payload alone consumes about 400 KiB; runtime overhead adds more. When arrivals fall to 800/s, the queue drains at 200/s and needs two seconds to empty. Restoring service does not erase the backlog immediately.

**Decision:** reject, coalesce or slow incoming work when admitted demand exceeds capacity. Durable commands should not be silently discarded; superseded position snapshots often can be coalesced by entity.

### 5.2 An explicit M/M/1 model

For a single FIFO server with Poisson arrivals of rate `λ`, independent exponential service times of rate `μ`, unlimited buffer, and `λ<μ`, define utilization `ρ=λ/μ`. Stationary probability of `n` operations inside is `(1−ρ)ρⁿ`. Neighboring state flow gives a factor `ρ` per additional operation; normalization gives `1−ρ`. Summing this geometric distribution gives mean occupancy `ρ/(1−ρ)`; Little's Law then yields:

```text
W = 1/(μ − λ)
```

Here `W` is total residence time including service, not queue wait alone. Example: `μ=1,000/s`; at `λ=500/s`, mean residence is 2 ms. At 900/s it is 10 ms, and at 990/s it is 100 ms, although mean service remains 1 ms. The standard queue model and its assumptions are presented in [MIT's queueing-model lecture](https://web.mit.edu/1.041/www/lectures/L8-queuing-models-2026sp.pdf).

Real sync workloads violate these assumptions through batching, hot objects, heavy-tailed tasks, multiple workers and bursty reconnects. Use the curve to understand shrinking spare capacity, not to promise a measured p99. Head-of-line blocking can make one large document hurt small updates; fair scheduling and per-object budgets address that mechanism.

## 6. Loss, acknowledgments and retry amplification

### 6.1 A sequence without retransmission

Let `p` be the independent loss probability of each of `n` required packets. The chance all arrive is the product of their success probabilities:

```text
P(all arrive) = (1−p)ⁿ
P(at least one lost) = 1 − (1−p)ⁿ
```

At 1% loss across 100 packets, the chance at least one is lost is approximately 63.4%. This is why a low per-packet percentage can still affect many multi-packet transfers. The example concerns packets required by this hypothetical transfer; transport fragmentation and recovery change the application outcome.

Independence fails during congested bursts and outages. The formula cannot estimate application message loss over TCP, which retransmits and presents a byte stream. It estimates an assumed underlying schedule, not a transport guarantee.

### 6.2 Repeated delivery attempts

Let `q` be the independent probability that one entire attempt fails to produce a usable acknowledgment. If request loss is `p_d` and acknowledgment loss is `p_a`, independent within an attempt, then:

```text
q = 1 − (1−p_d)(1−p_a)
E[attempts until acknowledgment] = 1/(1−q)
```

The expectation follows by summing the probabilities of reaching attempt 1, 2, 3, and so on: `1+q+q²+…`. With 5% request loss and 5% acknowledgment loss, `q=0.0975` and the mean is about 1.108 attempts. When an acknowledgment alone is lost, an already applied operation can be repeated. The delivery calculation does not make repeated application safe.

If at most `k` attempts are allowed:

```text
P(no acknowledged completion) = qᵏ
E[attempts actually sent] = (1−qᵏ)/(1−q)
```

For three attempts in that example, unacknowledged completion probability is about 0.000927, or 0.0927%. This includes histories where the operation committed but every relevant response was lost. It must not be labeled the probability of “no effect.”

For offered original rate `λ₀`, unlimited independent retries give mean attempt load `λ_attempt=λ₀/(1−q)`. At `λ₀=900/s` and `q=0.2`, that becomes 1,125/s. A server capable of 1,000/s is now overloaded. In reality overload increases `q`, so the independent constant-loss model understates the feedback loop.

**Decision:** keep identities stable across attempts, bound retry budgets, use backoff with jitter, and throttle reconnect work. Measure attempts and unique logical requests separately. No finite retry schedule guarantees progress through an indefinite partition.

## 7. Clock uncertainty as an interval

Let true time be `t` seconds and a clock reading be `C(t)`. Assume an initial absolute error at most `ε₀` seconds and a fractional drift bound `ρ` seconds/second for an unsynchronized interval `Δ`. Integrating the maximum rate error gives:

```text
|C(t)−t| ≤ ε₀ + ρΔ = ε
```

At `ε₀=5 ms`, drift 20 parts per million (`ρ=0.000020`), and `Δ=3,600 s`, the bound is 77 ms. Two such clocks can differ by up to 154 ms, from opposing error directions. Suspend/resume, clock stepping, virtual clocks or hardware outside the assumed drift bound invalidate this calculation.

If event readings are `C_A` and `C_B` with error bounds `ε_A` and `ε_B`, the corresponding possible true-time intervals are `[C_A−ε_A,C_A+ε_A]` and `[C_B−ε_B,C_B+ε_B]`. Strictly separated intervals establish physical precedence under the model. With both uncertainties 77 ms, readings separated by 100 ms are insufficient; 200 ms separates the intervals by 46 ms.

A precedence bound is still not a causal dependency: Dev may perform a later edit without seeing Mira's earlier edit.

### Clock synchronization cannot observe path asymmetry directly

In a simplified NTP exchange, timestamps `t₁,t₄` are client send/receive readings and `t₂,t₃` server receive/send readings, in seconds. With constant clock offset `θ` (server minus client) over the exchange:

```text
θ_est = ((t₂−t₁) + (t₃−t₄))/2
δ = (t₄−t₁) − (t₃−t₂)
```

`δ` estimates the network round-trip delay after subtracting server residence. Symmetric path delay makes the offset estimate exact in the ideal model. If true forward and reverse delays are `d_f,d_r`, its error is `(d_f−d_r)/2`. For 30 ms forward and 10 ms reverse, the estimate is biased by 10 ms even with perfect timestamping. [RFC 5905, June 2010, §8](https://www.rfc-editor.org/rfc/rfc5905.html#section-8)

The numerical bias is an illustrative calculation. Real NTP adds filtering, multiple sources and clock discipline. Neither successful NTP exchange nor a wall-clock timestamp proves that a user saw another's edit. Use monotonic elapsed-time sources for local durations and causal/version metadata for dependency decisions.

## 8. Causal partial orders and vector cost

A strict partial order is transitive and irreflexive; not every pair must be comparable. A causal event graph has an edge for local order and send-to-receive influence. A topological ordering extends its causal constraints, but can freely arrange incomparable events. Logical clocks address such ordering constraints. [Lamport, 1978](https://www.microsoft.com/en-us/research/publication/time-clocks-ordering-events-distributed-system/)

For vectors with `r` fixed tracked participants, let `V(a)[i]` be the event count known for participant `i` at event `a`. Define:

```text
V(a) < V(b) iff every component of V(a) is ≤ its component in V(b),
                  and at least one component is strictly smaller.
```

Under the full vector-clock protocol, this comparison represents causal precedence. Incomparable event vectors represent concurrency. The link between vector time and causal information is developed by [Mattern, 1989](https://pages.cs.wisc.edu/~remzi/Classes/739/Fall2018/Papers/mattern89.pdf).

Constructed history:

| Event | Mira's vector | Dev's vector | Meaning |
|---|---|---|---|
| Initial | `[0,0]` | `[0,0]` | No events |
| Mira inserts X | `[1,0]` | `[0,0]` | Local event |
| Dev independently inserts Y | `[1,0]` | `[0,1]` | Concurrent with Mira |
| Dev receives Mira's event | `[1,0]` | `[1,2]` | Componentwise max, then receive increment |
| Dev creates dependent comment | `[1,0]` | `[1,3]` | Has causal knowledge of both edits |

Fixed-width vectors cost `r×b_v` bytes before encoding overhead, where `b_v` is bytes per counter. At 1,000 tracked participants with 8-byte counters, one vector costs 8,000 bytes; attaching it to 10,000 operations/s would mean 80 MB/s of vector bytes alone. Comparison/merge scans `r` components, giving `O(r)` time in a dense representation.

This is an intentionally naive representation. Sparse vectors, version vectors per object, dotted histories and membership epochs have different costs. Do not silently replace a participant's old identity after counter reset: doing so confuses new events with old ones. A vector clock also differs from a version vector that records writes only; label which events advance counters.

## 9. Operation algebra and state equivalence

Two operations `a,b` commute on state `s` when:

```text
apply(apply(s,a),b) ≈ apply(apply(s,b),a)
```

Here `≈` is equality of the logical observations promised by the object; it need not mean byte-identical indexes. The requirement must hold for the reachable states and enabled operations in scope. Starting at counter 4, adding 2 then 3 or 3 then 2 yields 9. Setting 5 and setting 7 do not commute under ordinary assignment. The foundation lab's two ASCII inserts also fail this equation.

Operation `a` is idempotent when `apply(apply(s,a),a)≈apply(s,a)`. Adding an already-present set member is idempotent: `{x}` remains `{x}`. Adding 1 is not: counter 0 becomes 2 on duplicate delivery. Commutativity permits reordering; idempotence permits repetition. Neither by itself establishes eventual delivery or allowed execution after permission revocation.

To derive order-independent execution for a finite collection, transform one ordering into another by swapping adjacent permitted operations. If every required swap preserves state and applicability, the final observations agree. Causally dependent noncommuting operations cannot be freely swapped. Raw increments need deduplication or an exactly-once effect boundary even though independent increments commute.

### A small join proof

Let a grow-only evidence set contain accepted operation IDs. Order states by subset inclusion, and merge by union. Union contains both inputs, and every set containing both also contains the union; it is their least upper bound, or **join**. State-based CRDT theory uses joins with monotonic updates as a sufficient convergence construction. [Shapiro et al., RR-7506, 2011, §2.3](https://www.lip6.fr/Marc.Shapiro/papers/2011/Comprehensive-CRDTs-RR7506-2011-01.pdf)

Our evidence example begins at `{}`. Mira obtains `{M:1}`, Dev obtains `{D:1}`. Either merge yields `{M:1,D:1}`. A third state `{M:2}` yields the same three-element union in either grouping, and receiving `{M:1}` again changes nothing. The element-membership test proves associativity, commutativity and idempotence: membership in the result means membership in at least one input regardless of grouping, order or duplicates.

Such evidence grows monotonically. The user-visible document can still shrink if a retained operation records a deletion. Information growth and visible-data growth are different. Repeated exchange must eventually convey all relevant evidence; algebra does not deliver packets.

### Convergence and invariant closure need different proofs

Let `s₀` be a common valid base, `x,y` valid states reachable by permitted independent operations, `merge(x,y)` their specified reconciliation, and `I(s)` the domain-validity predicate. A relevant closure obligation is:

```text
I(x) and I(y) ⇒ I(merge(x,y))
```

This must hold for the allowed reachable pairs, not merely for convenient test states. It is independent of whether `merge` is associative, commutative and idempotent. Invariant-confluence research studies this distinction under a defined coordination-free execution model. [Bailis et al., 2014](https://www.vldb.org/pvldb/vol8/p185-bailis.pdf)

Constructed example: initial stock is one and state is a set of uniquely accepted reservations. Define remaining stock as one minus that set's size. Mira's set `{M:1}` and Dev's `{D:1}` each leave zero, satisfying nonnegativity. Union converges to a two-reservation set, leaving minus one. Algebra succeeds; invariant closure fails.

The model changes if reservation rights were divided before disconnection: only the holder of the one right may accept the reservation. That requires a proof for rights transfer/duplication, not just another tie-breaker. Rejection or compensation are other policies, with different acceptance promises.

## 10. Same committed state machine, different user speculation

Let `s₀` be initial state, `f` the deterministic transition function, and `o₁…oₖ` the common accepted operation order. If two replicas start equal and use the same `f`, equality after step `j` implies equality after `j+1`. Induction establishes equality after all `k` steps.

Numerical example: counter 0 with operations `+2`, then `+3`, produces 2 then 5 on both replicas. A replica that instead reads wall-clock time during application can diverge despite the same log. Record nondeterministic decisions as command data, or use explicitly agreed simulation inputs and versioned behavior. Replicated-state-machine logs provide the accepted-history mechanism described in [Raft, 2014, §2](https://raft.github.io/raft.pdf).

Initial state, code/schema version, numeric behavior and external effects are proof assumptions. JavaScript arithmetic overflow or mixed schema interpretation can violate them. Game prediction intentionally uses incomplete input history and can differ before reconciliation; it is not evidence that authoritative replicas may arbitrarily diverge.

## 11. Storage, compaction and merge complexity

### 11.1 Retained logs and offline horizons

Let `λ` be committed operations/second, `b` mean bytes per retained operation, and `D` retention seconds:

```text
H = λbD
```

`H` is raw retained log bytes. It follows from rate times duration times bytes per item, assuming stationary rates/sizes, no compression, no indexes and no replication. With 1,000/s, 200 bytes/op and one day, this is 17.28 GB. Three full storage replicas require 51.84 GB of raw copies, before additional overhead.

A seven-day offline promise multiplies this retention budget unless a snapshot/reset strategy changes the protocol. Retaining a snapshot is not enough if old local changes depend on removed causal/delete evidence.

### 11.2 Snapshot frequency and catch-up

Let `T` be seconds between snapshots, `S` snapshot bytes, and keep rate `λ` and bytes/op `b` as above. Assuming a coherent snapshot boundary and no retained earlier tail for other purposes:

```text
maximum tail bytes between snapshots ≈ λbT
average tail bytes over uniformly sampled snapshot phase ≈ λbT/2
snapshot production rate = S/T bytes/s
```

At `λ=1,000/s`, `b=200 bytes`, `T=60 s`, the maximum tail is 12 MB and phase average 6 MB. A 5 MB snapshot generated each minute means about 83,333 bytes/s of snapshot output per object, not including computation or retention of previous snapshots.

Let `m` be replay operations/second on a reconnecting client. If new operations arrive while replaying, its net catch-up capacity is `m−λ`, requiring `m>λ`. A tail of `h` operations then takes approximately `h/(m−λ)` seconds under constant rates. For `h=60,000`, `m=10,000/s`, and `λ=1,000/s`, replay takes about 6.67 seconds, plus snapshot transfer/apply. At `m≤λ`, ordinary replay never catches up; use a newer snapshot, increase capacity or reduce assigned state.

Concurrent snapshot creation, bursty writes, compression, parallel apply and whole-document copies change these costs. Snapshot boundaries and atomic checkpointing remain correctness requirements even when the size model changes.

### 11.3 Name what each asymptotic variable counts

| Mechanism | Straightforward cost | Example and limitation |
|---|---|---|
| Scalar version check | `O(1)` metadata/check | One token; database index lookup/locking still has its own cost |
| Dense causal vector | `O(r)` comparison/metadata | 1,000 components scanned; `r` is tracked writers, not operations |
| Flat three-way merge | `O(f)` field visits | 30 scalar fields; equality of large values adds payload cost |
| Retained candidate register | Up to `O(h²r)` naive dominance projection | Compare all pairs of `h` writes with `r` components; pruning needs retained causal context |
| Set union | Expected `O(a+b)` with hash sets | 100 and 200 tags; hashing, malicious keys and copying change constants |
| OT against pending operations | `O(k)` transform calls per remote operation | 40 pending operations; individual structured transforms need not be constant time |
| Naive string insertion | `O(n)` copying | 1 MB text copied per edit; ropes/trees change access and copying costs |

These bounds describe algorithms, not universal library promises. Measure state size, metadata size, pending count and transform time separately. A fast merge that loses intent or bypasses authorization is not a useful optimization.

## 12. Fan-out and slow consumers

Let `e` be source events/second, `n` mean recipients/event and `b` encoded bytes/event. Ignoring compression and overhead, outbound payload rate is:

```text
B_out = enb
```

With `e=200/s`, `n=50`, `b=300`, this is 3,000,000 bytes/s and 10,000 recipient deliveries/s. A recipient count of 500 multiplies both by ten without increasing source-event rate.

For one consumer, let `u` be incoming bytes/s and `d` drain bytes/s. When `u>d`, buffered bytes grow at `(u−d)t` after `t` seconds, by the same accounting as §5. A client receiving 100 KB/s and draining 60 KB/s accumulates 2.4 MB in one minute.

**Decision:** bound buffers, disconnect/reset slow clients with a durable catch-up route, and coalesce ephemeral state. Dropping one old position sample can be sensible; dropping a durable edit while falsely advancing its cursor is data loss.

## 13. Worked design: offline workspace with a hot document

Assume one hot document, 200 operations/s, mean retained operation 300 bytes, 100 connected readers, 80 ms RTT, local render target 16 ms, and a server service capacity of 500 operations/s. These are hypothetical inputs, not measured capacity.

1. **Define acknowledgment:** mutation, replay result and log entry commit together before acceptance is returned. Local render precedes it.
2. **Check pipelining:** stop-and-wait caps one sender at 12.5 operations/s; independent IDs and versions permit multiple outstanding requests, but dependent operations need ordered interpretation.
3. **Budget fan-out:** 200×100×300 gives 6 MB/s payload. Provision delivery work separately from commit work; one source update implies 100 deliveries.
4. **Estimate admitted concurrency:** mean 60 ms server residence at 200/s implies 12 operations inside on average. This is an occupancy estimate, not a safe queue maximum.
5. **Budget one-day history:** 200×300×86,400 gives 5.184 GB before replicas/indexes. Decide offline cursor retention and reset semantics explicitly.
6. **Catch up from a one-minute tail:** 12,000 operations replayed at 2,000/s with 200/s live ingress takes about 6.67 seconds after transfer/apply overhead. A five-minute disconnect with the same rates takes about 33.3 seconds.
7. **Test overload:** a reconnect burst offering 1,000/s exceeds 500/s capacity. Pace catch-up and submissions separately, preserving local unsent work; do not assume mean interactive load covers storms.
8. **Verify correctness:** reorder notifications, duplicate submissions and crash after commit but before acknowledgment. Final states must agree under the selected merge policy, and each accepted ID must have one effect.

Variation: if updates carry a 1,000-writer dense vector, its 8 KB counter payload overwhelms the assumed 300-byte event. Choose narrower causal scopes or another supported representation, then revise both the proof and the traffic estimate. Compression without representation analysis does not remove this architectural mismatch.

Run the [quantitative and conflict lab](../../../playground/synchronization/01-math-conflicts/README.md) to reproduce selected calculations and check concrete algebraic properties. It uses no network or database and cannot validate the assumed service capacity.

## 14. Diagnose the model before changing the system

| Observed failure | Investigate | Response |
|---|---|---|
| Queue rises while throughput plateaus | Offered vs admitted rate, retries, hot-object serialization | Bound admission, isolate contention, preserve durable work |
| Mean is acceptable but p99 is poor | Batch timing, pauses, large tasks, correlated stages | Trace whole requests and introduce fair scheduling |
| Replay never catches up | Replay capacity minus live ingress | New snapshot or narrower subscription; retain unsent edits |
| LWW chooses implausible updates | Clock uncertainty and forged future stamps | Logical/causal metadata or server decisions; recover history |
| “Compression fixed scale” but CPU saturated | Encode/decode cost and expanded metadata | Measure bytes and CPU together; bound message sizes |
| Stable state grows forever | Tombstones, retry IDs, writer churn, snapshots | Define safe reclamation/reset protocol before discarding evidence |

Network loss and queue overload are often dependent, so fit measurements before applying independent formulas. Persistent storage and brokers introduce additional queues; give each a boundary. Protect against maliciously large vectors, histories, text payloads and recipient lists. An average-byte budget is not an input limit.

## 15. Assumptions and design rules to retain

- Units and observation boundaries are part of an equation's meaning.
- Little's Law accounts for averages; it does not grant stability or predict tails.
- Spare capacity controls backlog drain, retries and catch-up.
- Transport acknowledgment and durable application acceptance are different events.
- Logical order, physical precedence and user intent are different properties.
- Convergence needs algebra and eventual information delivery; invariants need a domain argument.
- Metadata, retry history and offline horizons consume measurable resources.
- A measured departure from a model is evidence to revise its assumptions.

## Release review

Status: **ready — complete for the stated educational scope**.
Reviewer: Codex (AI technical and editorial review); no independent human review claimed.
Review date: 2026-10-14.
Open issues: none blocking this educational release.
Scope limits and further validation: Constructed numerical inputs and finite algebra checks; no measured capacity or universal tail-latency prediction.

See [the review record](../REVIEW.md) and [actual validation output](../VALIDATION.json).
