# Repository map for agents

`catalog/topics.json` owns topic identity, status, paths, prerequisites, related edges, learning tracks, and milestone metadata. `scripts/lab.py` generates `INDEX.md`, `docs/TAXONOMY.md`, `docs/LEARNING-PATHS.md`, and `interactive/atlas.html`; edit their inputs rather than their output. The atlas shell lives in `templates/atlas.html`.

`domains/<domain>/<topic>/` owns mechanism explanations and local artifacts. `projects/` owns cross-topic integration. Local `lab.json` manifests own executable lab metadata and paths relative to the manifest. A planned topic does not require a directory. Seed, growing, and reference topics require a README.

Read [the design](../docs/DESIGN.md) for ownership boundaries and [lab standards](../docs/LAB-STANDARDS.md) for execution contracts. Root instructions apply everywhere. Local `AGENTS.md` entries point to useful local `.agent` files; do not duplicate the root protocol.

Generation never executes manifest commands. Preserve this boundary. Avoid building a central application runtime merely to index independent labs.
