# Experiment: Bound authorization codes

**Hypothesis:** wrong client/redirect/scope/time or second redemption fails.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 09-oauth-authorization-code/experiments/run.mjs`, followed by `node --test 09-oauth-authorization-code/tests/*.test.mjs`. **Expected:** wrong client/redirect/scope/time or second redemption fails. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Atomic consumption and exact registration protect distinct bindings. **Limits:** complete OAuth HTTP serialization, UI/client registry and distributed transactions. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
