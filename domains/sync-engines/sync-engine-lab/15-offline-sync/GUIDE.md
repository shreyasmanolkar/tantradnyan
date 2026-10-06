# Walkthrough: What survives a client process restart before delivery?

1. Name the initial state in [the code](src/demo.mjs). Separate data, identity, versions and pending messages.
2. Before executing, predict every `assert` from the transition rules in master chapters 11, 15.
3. Run the demo and inspect its JSON trace/result. Locate the state changed by each transition.
4. Change one operation or delivery order. Explain which invariant remains true and which guarantee was never present.
5. Inspect the counterexample and boundary checks in [shared tests](../shared/tests/). Derive a smaller failing trace before fixing a rule.

Mechanism: Counter and outbox persist together; restart reuses the original operation ID.

**Scope:** Memory-backed Store emulates disk here; final integration tests use real temporary files.

Design exercise: specify the operation's precondition, effect, identity, causal context and recovery rule. Explain what a second independent authority would change.

Full derivation, equations, transport and architecture comparisons remain in the [single master curriculum](../../GUIDE.md).
