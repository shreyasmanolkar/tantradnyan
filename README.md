# Tantradnyan — a engineering laboratory

Start with a question. Explain the mechanism, predict an outcome, build the smallest useful model, try to break it, and compare it with a real system.

This repository is a living laboratory, knowledge base, and collection of executable explanations. The catalog maps the intended scope; **two starter topics contain interactive labs**, alongside the sync-engine curriculum and AWS learning material. Planned topics are explicitly marked so a map never implies that a textbook has already been written.

## Start here

- [Architecture and rationale](docs/DESIGN.md) — how the system fits together.
- [Topic index](INDEX.md), [complete taxonomy](docs/TAXONOMY.md), and [interactive knowledge map](interactive/atlas.html).
- [Learning paths and topic milestones](docs/LEARNING-PATHS.md).
- [Initial roadmap](ROADMAP.md) and [first 20 projects](projects/README.md).
- [Contribution workflow](CONTRIBUTING.md) and [reusable templates](templates/README.md).
- [Initial verification and its limits](docs/VALIDATION.md).
- [AWS domain](domains/aws/README.md) — imported foundations, service architecture, operations, and hands-on labs.
- [Sync engines](domains/sync-engines/README.md) — first-principles guide and twenty Node.js labs.

## Try a learning loop

| Question | Explanation and next steps | Interactive lab |
| --- | --- | --- |
| How does `margin: auto` center a div? | [CSS centering](domains/web-platform/css-centering/README.md) | [Manipulate real layout](domains/web-platform/css-centering/interactive/index.html) |
| How does a CPU execute an instruction? | [Instruction execution](domains/computer-architecture/instruction-execution/README.md) | [Step a tiny CPU](domains/computer-architecture/instruction-execution/interactive/index.html) |

Open the HTML files directly in a browser. They need no package installation, remote assets, or backend. Alternatively, from the repository root:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit `http://127.0.0.1:8000/interactive/atlas.html`. Python 3.10+ runs the repository tooling; Node.js 18+ runs the CPU headless experiment. The sync-engine labs require Node.js 22.4+. Neither runtime is required to open the HTML labs.

## MCP tools

Playwright and Context7 are configured for Claude Code in [`.mcp.json`](.mcp.json), Codex in [`.codex/config.toml`](.codex/config.toml), and Cursor in [`.cursor/mcp.json`](.cursor/mcp.json). The Codex Context7 entry reads `CONTEXT7_API_KEY` from the environment; keep the key out of tracked files. Claude Code may require project trust and server approval before loading `.mcp.json` entries.

```sh
python3 scripts/lab.py check       # metadata, prerequisites, manifests, and local links
python3 scripts/lab.py build       # regenerate the index, taxonomy, paths, and atlas
python3 scripts/lab.py check --generated  # also detect stale generated outputs
node domains/computer-architecture/instruction-execution/experiments/instruction-trace/run.js
```

## Navigation and growth

`domains/` owns explanations and small models. `projects/` combines domains. `catalog/` owns navigation metadata. `interactive/` is a generated launchpad; topic demos remain beside their explanations. Experiments, simulations, diagrams, and language variants live with the topic or project that explains them.

[QUESTIONS.md](QUESTIONS.md) captures curiosity, [IDEAS.md](IDEAS.md) holds possible investigations, [EXPERIMENTS.md](EXPERIMENTS.md) explains the experiment registry, and [ROADMAP.md](ROADMAP.md) limits active work. There is no expectation that every topic needs every kind of artifact or every level of depth.
