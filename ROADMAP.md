# Initial roadmap

Use readiness criteria rather than calendar deadlines. At most two topics and one integration project should be active. The first milestone is a complete learning loop, not broad coverage.

| Phase | Work | Exit evidence |
| --- | --- | --- |
| 0 — Establish the loop | Use the three starter labs; predict each output before manipulating it; record one surprise | One personal explanation, one reproduced failure, and three new questions |
| 1 — Bits, state, and constraints | Binary representation, truth tables, half/full adders, CPU instructions; CSS box constraints as a parallel accessible investigation | Predict an instruction trace, implement an adder, and explain wrapping and overflow |
| 2 — Programs as data | Tokenizer, expression parser, evaluator, stack VM; connect compiled instructions to the CPU model | Run a small language and trace one expression through every representation |
| 3 — Processes and communication | Shell, memory arena, HTTP server; inspect syscalls and DNS resolution | Explain process boundaries, allocation lifetime, framing, and a partial read |
| 4 — Durable state | Append-only KV, page/index model, WAL recovery, bounded database | Inject modeled crashes and identify exactly which acknowledgments survive |
| 5 — Failure and collaboration | Reliable-delivery simulation, replicated KV, CRDT counter → sequence, offline document sync | Replay duplication, partitions, concurrent edits, and reconnect; explain guarantees |
| 6 — Integrated systems | Choose a compiler, xv6 exploration/toy OS, collaborative editor, distributed task engine, or agent harness | Meet a narrow system contract, document failures, then inspect a real implementation |
| Ongoing — Follow curiosity | GPU, security, formal verification, robotics, quantum computing, or a newly discovered domain | One bounded question with a reproducible artifact before broadening scope |

Phases are suggested dependencies, not prerequisites for all curiosity. Start with CSS, Lisp, electronics, or databases if that is the question you want to pursue. The catalog shows gaps to fill when a mechanism needs more background.

## Current state

The architecture, catalog, templates, generated navigation, and three starter labs exist. Starter milestone artifacts are available; learner outcomes remain unverified. The first 20 projects are scoped proposals, with links to the starter mechanisms where applicable.

## Next bounded build

Choose project 1 (adder), 2 (CPU extension), or 3 (CSS constraint walkthrough) from [the project list](projects/README.md). Finish its acceptance evidence and record a new question before adding another implementation language or framework.
