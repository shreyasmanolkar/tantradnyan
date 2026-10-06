# First 20 foundational projects

Choose a route through these projects based on your questions. The order below gradually increases the number of mechanisms in one build. These are **scoped proposals**; the starter CPU, layout, and counter models provide useful components for projects 2, 3, and 19.

| # | Project / intended folder | Prerequisite topic IDs | Smallest useful build | Experiment and completion evidence |
| --- | --- | --- | --- | --- |
| 1 | Adder from gates / `adder-from-gates` | `binary-representation`, `boolean-logic`, `combinational-logic` | Half adder → full adder → 8-bit ripple carry | Exhaustive input checks; distinguish carry from signed overflow; inspect carry propagation |
| 2 | Tiny CPU / `tiny-cpu` | `instruction-execution`, `registers-and-alu`, `assembly` | Extend the starter ISA with compare/branch or an assembler | Trace a loop; wrapping, invalid instruction, stack bounds; compare an instruction with RISC-V semantics |
| 3 | CSS constraint explorer / `css-constraints` | `css-centering`, `box-model`, `layout` | Extend the existing actual-layout lab with padding or max-width | Predict used width/margins, compare browser measurements, explain overflow and the formatting context |
| 4 | Hash table / `hash-table` | `complexity`, `hash-tables` | Chaining, then resize | Force collisions; compare load factors; verify all keys survive resizing |
| 5 | Expression language / `expression-language` | `lexing`, `parsing`, `trees-and-graphs` | Tokenize → parse → AST → evaluate | Ambiguous precedence and malformed input fixtures; trace `1 + 2 * 3` through representations |
| 6 | Tiny Lisp / `tiny-lisp` | `lisp`, `interpreters`, `closures` | Reader, environments, evaluator, lexical closures | Shadowing and recursive-call examples; explain environment capture and deferred features |
| 7 | Stack virtual machine / `stack-vm` | `virtual-machines`, `instruction-execution` | Bytecode interpreter with stack, jumps, and calls | Trace a function call; malformed bytecode and underflow; compare with the CPU model |
| 8 | Arena allocator / `arena-allocator` | `memory-allocation`, `alignment`, `systems-programming` | Alignment-aware bump arena in C | Bounds/alignment assertions, exhaustion, lifetime examples; optional Rust comparison with unsafe obligations |
| 9 | Small shell / `small-shell` | `processes`, `system-calls`, `shells`, `pipes-and-ipc` | Execute a program, wait, add a pipe and redirect | Trace process creation and file descriptors; failed exec, partial reads, and EOF; no full POSIX grammar |
| 10 | HTTP server / `http-server` | `sockets`, `http`, `byte-streams` | Bounded HTTP/1.1 request parser and response over loopback | Split a request across reads; limit sizes and handle errors; compare framing with the specification |
| 11 | DNS explorer / `dns-explorer` | `dns`, `udp`, `binary-representation` | Parse saved DNS messages, then query a chosen resolver | Decode compression pointers safely; malformed lengths, TTLs, truncation; no claim of a full recursive resolver |
| 12 | Append-only KV store / `append-only-kv` | `files-and-pages`, `hash-tables` | Framed records, replay index, overwrite and delete | Truncated tail, corruption handling, replay correctness; quantify obsolete log bytes |
| 13 | B+ tree index / `bplus-tree` | `b-trees`, `files-and-pages` | In-memory splits and range scans, then pages | Force root/leaf splits; ordering and separator invariants; compare page access across sizes |
| 14 | WAL recovery engine / `wal-recovery` | `write-ahead-logging`, `storage-durability` | Explicit durable-log model with commit markers and replay | Inject failure at every modeled boundary; committed-prefix recovery; distinguish process crash and power loss |
| 15 | Tiny database / `tiny-database` | `b-trees`, `write-ahead-logging`, `transactions` | Combine pages, index, and log; single writer and narrow transaction API | Recovery plus atomicity fixtures; document the concurrency and durability guarantees actually implemented |
| 16 | Tiny compiler / `tiny-compiler` | `parsing`, `compiler-ir`, `code-generation`, `virtual-machines` | Compile the expression language to the stack VM | Interpreter/compiler differential fixtures; trace one AST through IR into executable bytecode |
| 17 | Scheduler simulator / `scheduler-simulator` | `scheduling`, `queues`, `processes` | FCFS, round robin, explicit arrival and burst times | Compare response/wait/turnaround; expose starvation; avoid claiming hardware context-switch timings |
| 18 | Reliable delivery simulator / `reliable-delivery` | `byte-streams`, `tcp`, `discrete-event-simulation` | Sequence numbers, ACKs, timeout/retry on a modeled lossy link | Replay loss, duplicates, reorder, and delayed ACKs; bounded delivery properties; explain why this is not a full TCP stack |
| 19 | CRDT replica laboratory / `crdt-replicas` | `crdt-counters`, `causal-order`, `replication` | Extend the starter counter to a PN-counter or observed-remove set | Merge order/duplication properties; show an incorrect merge counterexample; identify delivery/identity assumptions |
| 20 | Offline sync prototype / `offline-sync` | `sync-engines`, `crdt-counters`, `persistent-client-state`, `conflict-resolution` | Persistent client state, outbound queue, reconnect with one explicit conflict rule | Offline updates, duplicate delivery, client restart, and reconnect; prove a narrow convergence claim; defer text intention semantics |

## Combining these into larger systems

| Next project | Combine | Bound the first milestone |
| --- | --- | --- |
| Toy filesystem | Pages, indexes, allocation, durability | Block-image file, allocation bitmap, directories, crash model |
| Toy OS / xv6 extension | ISA, privilege, processes, virtual memory, scheduler, filesystem | Boot under an emulator and implement one kernel feature with a trace |
| Tiny browser | Parser, style cascade, layout, rendering, networking | A specified HTML/CSS subset; visualize box construction |
| Distributed KV database | KV, logging, replication, consensus | Fixed nodes, explicit failure model, one documented read/write consistency contract |
| Collaborative editor | Sequence CRDT or OT, sync, storage, editor state | Plain text with concurrent edit and reconnect scenarios; separate presence from document state |
| Multiplayer networking | Simulation, reliable/unreliable messages, interpolation, prediction | A small authoritative world with latency and reconciliation traces |
| Distributed task executor | Processes, queues, leases, retries, observability | Explicit task deduplication and recovery semantics after worker failure |
| AI coding agent harness | Process/tool execution, permissions, state, evaluation | Bounded tasks, inspectable context, recorded tool I/O, reproducible local evaluation |

Use [the project template](../templates/project/README.md) when a proposal becomes active. Link to topic explanations and keep the project's acceptance evidence beside its source. Production systems add constraints gradually; avoid growing the first build until you can explain its current behavior.
