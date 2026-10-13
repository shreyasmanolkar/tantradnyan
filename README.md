# Technical guides

This repository is for substantial, evidence-based technical guides. A guide should help a motivated reader build a working mental model, understand important trade-offs, and apply the topic in a real setting. A short overview can be useful, but it is not a substitute for a guide.

## Create a guide

1. Start with [`guides/TEMPLATE.md`](guides/TEMPLATE.md). Put finished guides in `guides/<topic-slug>/` and keep topic research and source notes beside the guide when they aid review.
2. Follow the authoring instructions in [`AGENTS.md`](AGENTS.md). They apply to creating, expanding, and reviewing guides in this repository.
3. Establish the reader, scope, prerequisites, and the questions the guide must answer before drafting. Research current behavior from primary sources and record citations as you write.
4. Teach the topic from its foundations to its operation in practice. Include a worked example, realistic use cases, trade-offs, failure modes, and a path for further learning where they apply.
5. Review the guide for factual support, completeness, clear language, and usefulness to the intended reader. Do not mark it ready just because it has all the headings.

## Editorial standard

Write in plain, direct English, using Orwell's six rules as editing prompts and the principles of ASD-STE100 (Simplified Technical English) as a guide to controlled, unambiguous technical prose. This repository does not claim formal ASD-STE100 compliance or certification. For exact vocabulary and rule decisions, consult the current official specification; do not copy or redistribute its protected dictionary or full text here.

The current issue and access instructions are published by the [ASD-STE100 Maintenance Group](https://www.asd-ste100.org/STE_downloads.html). Record the issue consulted in each guide's metadata. Orwell's rules come from [“Politics and the English Language”](https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/?d7_alias_migrate=1). Clarity serves the technical explanation: do not remove necessary detail, precise terminology, or useful examples to make prose shorter.

## Ready for readers

A guide is ready when a reviewer can trace important claims to reliable sources, follow the explanation from first principles through application, and use its examples without guessing at missing steps. Mark unresolved version, safety, or scope limitations plainly. The template's review questions are the release gate.

## Completed learning resources

- [Synchronization, distributed state and multiplayer systems](guides/synchronization/README.md): eighteen guides, shared references and runnable Projects A–G. [Release review](guides/synchronization/REVIEW.md) records the AI review, tested examples and scope limits.
