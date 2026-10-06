# How to grow the laboratory

## Add a question

Capture it in [QUESTIONS.md](QUESTIONS.md). Look for a canonical topic in [INDEX.md](INDEX.md). Start from the smallest observable behavior rather than from a list of technologies to cover.

## Add a topic

1. Choose its domain and stable kebab-case ID. Extend an existing topic when the mechanism already has a home.
2. Add a catalog record using the field contract in [catalog/README.md](catalog/README.md). Planned topics need no folders.
3. To activate it, create `domains/<domain>/<topic>/README.md` using [the topic template](templates/topic/README.md) and add a tangible first artifact. Set its status to `seed`.
4. Add useful prerequisite and related edges. State milestone outcomes and link existing artifacts; do not mark unperformed investigations verified.
5. For a lab, copy the lab manifest template beside the HTML, adapt it, and list its root-relative manifest path in the topic's `labs` field.
6. Generate navigation and check it:

```sh
python3 scripts/lab.py build
python3 scripts/lab.py check --generated
```

## Add an experiment or project

Keep a topic experiment beside its mechanism. Use [the experiment template](templates/experiment/README.md), including "not run" until observations exist. Add cross-topic builds under `projects/` using [the project template](templates/project/README.md); link their prerequisite topics and define acceptance criteria before expanding the implementation.

Root project and experiment lists are curated Markdown. Add new entries there; topic lab launches and milestone views are generated from metadata.

## Validate a change

Use checks that can refute the affected claims. A prose/catalog change needs catalog and link validation. A model change needs its documented examples, boundaries, and invariants. A lab change also needs review in a browser: reset, invalid input, keyboard controls, and visible state. Record the browser/runtime used when reporting results.

Commit small curated evidence, source, fixtures, and generated navigation. Keep build products and bulky raw data out of ordinary commits. Attribute external sources and pin production-code references. Choose a license before soliciting public contributions.
