# Research and implementation protocol

1. Identify the question and the observable behavior. Read the existing topic and related mechanisms before adding another home for the same concept.
2. State assumptions and the smallest model that could explain the behavior. Write a prediction or invariant before adding features.
3. Implement one mechanism in readable steps. Prefer explicit state over clever abstractions. Keep code close to the explanation it supports.
4. Exercise a worked example, a boundary, and a failure case. Use the same transition model in a visualization and headless execution.
5. Record results honestly: observed, expected, not run, or inferred. Describe what evidence could overturn the explanation.
6. Connect the toy to a primary source or pinned production implementation. Do not guess a commercial product's architecture.
7. Update catalog metadata when paths or milestones change; generate navigation; add useful next questions.

Changes should remain scoped to the question. Do not port to more languages without a comparison question, add dependencies for small static demos, replace educational steps with an opaque library, or erase an unexpected result. Do not change learner verification states on their behalf.

Tests should target observable properties and counterexamples. Documentation must describe how to run code, failure behavior, and model limitations. Avoid promises such as "production ready" or "complete protocol implementation" for bounded teaching models.
