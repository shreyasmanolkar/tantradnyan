# Catalog contract

`topics.json` is authoritative for navigation. It has `schema_version: 1`, `domains`, `topics`, and `tracks`.

Domain records contain `id`, `title`, `purpose`, and `groups` (each with `id` and `title`). Topic records contain `id`, `title`, `domain`, `group`, `path`, `status`, `question`, `prerequisites`, `related`, `tags`, and optional `milestones` and `labs`. Paths are root-relative. Topic status is `planned`, `seed`, `growing`, or `reference`. Planned paths are intended homes, not links to existing content.

Milestones contain a unique `level` (0–7), concrete `outcome`, `state` (`planned`, `available`, or `verified`), and root-relative `artifacts`. Existing artifact paths are required for available/verified milestones. Availability never implies learner verification. Catalog milestones can link local experiments, project acceptance notes, or source-reading notes.

Track records contain `id`, `title`, `purpose`, and an ordered `topics` array of IDs. Tracks recommend a question route; they need not include every prerequisite. The generated learning paths disclose entry prerequisites rather than promising readiness.

Lab discovery uses topic `labs`, a list of root-relative paths to local `lab.json` manifests. Each lab ID is globally unique. The manifest owns its title, entry HTML, optional shared model path, and limitations. See [lab standards](../docs/LAB-STANDARDS.md).

```sh
python3 scripts/lab.py check
python3 scripts/lab.py build
python3 scripts/lab.py check --generated
```

The tool validates references, statuses, paths, artifacts, local Markdown file links, manifests, and prerequisite cycles. `--generated` compares expected outputs in memory to committed output. Generated files carry a header identifying their source. Do not manually edit generated content.

Related edges may contain cycles. Prerequisites may not. Renaming a folder keeps its stable topic ID and updates the path and dependent local links. Add a domain/group without restructuring existing topics.
