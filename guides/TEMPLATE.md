---
title: "<Specific guide title>"
status: draft
topic: "<Topic and boundaries>"
audience: "<Who this is for and what they already know>"
prerequisites:
  - "<Knowledge or tools needed>"
last_reviewed: YYYY-MM-DD
technical_scope_as_of: "<Versions, date, or conditions that bound claims>"
asd_ste_reference: "Issue <number>, consulted YYYY-MM-DD; plain-language principles applied, not certified compliance"
---

# <Specific guide title>

## Why this topic matters

Explain the problem this topic solves, who encounters it, and what the reader will be able to understand or do after reading. Name the boundaries of this guide and point to adjacent topics it does not cover.

## Prerequisites and learning path

List the ideas, tools, and access the reader needs. Define a route through the guide for readers who need a quick orientation and for readers who need to implement or operate the system.

## First principles

Start with the underlying problem and constraints. Define the basic terms. Explain the simplest useful model, the assumptions behind it, and where that model stops being accurate. Build each later concept from these foundations.

## How it works

Explain the components and their relationships. Trace data, control, or responsibility through the system. Use diagrams, equations, or small examples when they make a mechanism easier to understand. Explain each step and why it occurs; do not leave a code listing or diagram to explain itself.

## A worked example

Choose a representative example. State the goal and assumptions, then work through the implementation or analysis in ordered steps. Explain expected results, how to check them, and what changes when an assumption changes. Include complete commands or code only when a reader can run them or adapt them with stated requirements.

## Real-world use cases

For each important use case, describe the context, constraints, why this approach fits, what an actual deployment or operation requires, and how success is measured. Distinguish established practice from an illustrative example. Include at least one case where another approach is a better fit when that helps readers choose.

## Design choices and trade-offs

Compare meaningful alternatives against the same criteria: cost, complexity, performance, reliability, security, maintainability, and operational burden, as relevant. State the conditions under which each choice makes sense. Avoid universal recommendations where context changes the answer.

## Failure modes and troubleshooting

Describe observable symptoms, likely causes, diagnostic steps, and recovery or mitigation. Include edge cases and common misconceptions that materially affect correct use. State when the reader should stop and seek expert or vendor guidance, especially for safety-critical or security-sensitive work.

## Security, safety, and operational concerns

Cover the risks that follow from applying this topic. Give concrete mitigations and explain residual risk. Identify legal, privacy, safety, or policy requirements only when relevant, with jurisdiction and date where applicable.

## Limitations and open questions

State what the guide does not establish, which claims depend on versions or context, and what remains uncertain. Do not convert an informed estimate into a fact.

## Sources and further study

Use linked citations near the claims they support. Prefer primary documentation, standards, specifications, original research, and direct measurements. Include publication or version dates where change over time matters. Add a short, annotated path to deeper material; explain what each source helps the reader learn.

## Review before marking ready

- Can a reader explain the central mechanism in their own words after following the first-principles section?
- Does the guide connect definitions to a complete worked example and realistic operating conditions?
- Are consequential claims supported by current, trustworthy sources, and are time-sensitive versions or dates recorded?
- Are alternatives, constraints, failure cases, and risks explained well enough to guide a real decision?
- Can readers verify that the example works and diagnose likely deviations?
- Does every section add understanding? Remove filler, repeated claims, unsupported certainty, and generic conclusions.
- Is language direct and unambiguous? Are necessary technical terms defined and used consistently?
- Has a reviewer checked both technical correctness and whether the guide answers the stated reader's needs?

Reviewer: <name or role>
Review date: YYYY-MM-DD
Open issues: <none, or list the specific remaining gaps>
