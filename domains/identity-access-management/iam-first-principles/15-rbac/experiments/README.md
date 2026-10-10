# Experiment: Role inheritance and assignment

**Hypothesis:** inheritance works; cycle/self-escalation denied.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 15-rbac/experiments/run.mjs`, followed by `node --test 15-rbac/tests/*.test.mjs`. **Expected:** inheritance works; cycle/self-escalation denied. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Administrative role changes need their own scoped authority. **Limits:** full custom-role persistence, ownership transfer and approval workflows. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
