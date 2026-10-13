# Guide authoring instructions

These instructions apply to all work in this repository. The repository's purpose is to produce useful, evidence-based technical guides, not text that only looks complete.

## Define the reader and scope

Before drafting, state who the reader is, what they know, what they need to understand or do, and what the guide covers. For a broad topic, choose a coherent boundary and identify adjacent topics that are out of scope. List the central questions a complete guide must answer.

## Research and evidence

- Prefer primary sources: official documentation and specifications, standards, original research, source code, reproducible measurements, and incident reports from responsible parties.
- Use secondary sources to orient or explain, then verify consequential claims against primary evidence when possible.
- Put citations near the claims they support. Record publication dates, product or standard versions, assumptions, and disagreements where they affect correctness.
- Never invent citations, test results, quotations, or deployment experience. State when evidence is missing, conflicting, or limited.
- Verify changeable facts before publishing. Bound claims by date or version when they can change.

## Explain from foundations to practice

Use [`guides/TEMPLATE.md`](guides/TEMPLATE.md) as a completeness aid. Adapt its sections to the topic and explain omissions that could leave a meaningful reader need unmet. Build a causal sequence: problem and constraints, terms, smallest useful model, mechanisms, real system behavior, then application.

Explain how components interact and why each step occurs. Include a worked example with assumptions, ordered steps, expected results, verification, and a meaningful variation. For real-world use cases, cover context, constraints, why an approach fits, deployment or operating requirements, and measures of success. Explain meaningful alternatives and trade-offs, failure symptoms and diagnosis, recovery, and relevant safety, security, privacy, or legal concerns.

Do not pad a guide to reach a word count or fill headings. A guide is too shallow if it mostly defines terms, repeats generic claims, lists benefits without mechanisms, or provides code without explaining assumptions, execution, and verification. Every section must help the stated reader reason or act.

## Language standard

Use Orwell's six rules from “Politics and the English Language” as revision questions:

1. Is a familiar metaphor or figure of speech doing stale work?
2. Can a shorter word replace a long one?
3. Can a word be removed without loss?
4. Can an active construction replace a passive one?
5. Can an everyday English word replace a foreign, scientific, or jargon term without losing precision?
6. Would following one of these rules make the sentence worse or distort its meaning? Break the rule before writing something barbarous.

These are prompts, not a ban on precise terminology, passive voice when the actor is unknown or irrelevant, or figures of speech that genuinely clarify. See Orwell's essay for the original wording and context.

Apply ASD-STE100 principles where they improve comprehension: use clear, direct sentences; keep one main idea per sentence; prefer active voice and explicit actors; use terms consistently; avoid ambiguous pronouns, idioms, vague references, and unnecessary noun strings; and make instructions concrete and sequential. Preserve exact technical terms, names, syntax, and distinctions when simpler wording would make the explanation wrong. Define specialized terms at first use and explain why they matter.

ASD-STE100 is a controlled language with specific rules and a controlled dictionary. These general principles do not establish formal compliance. For strict compliance requests, consult the current official issue and dictionary, verify applicable rules and vocabulary, and flag the need for qualified review. Do not reproduce the standard or dictionary in repository files. Consult the [official ASD-STE100 download page](https://www.asd-ste100.org/STE_downloads.html) and record the issue consulted in the guide metadata.

## Review and status

Review each guide against the substantive questions in its template. Check that examples can be followed, citations support nearby claims, and version-sensitive facts are current. A heading or checklist tick is not evidence that an explanation is complete. Consequential topics need a technically informed reviewer.

Use `draft` while research or explanation is incomplete, `review` when the substantive draft needs another reader, and `ready` only when material gaps are closed and reviewer, date, and open-issue fields are complete.
