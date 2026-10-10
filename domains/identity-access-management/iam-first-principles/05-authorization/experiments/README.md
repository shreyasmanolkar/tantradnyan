# Experiment: Default-deny authorization

**Hypothesis:** read allowed, write/admin/cross-tenant denied.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 05-authorization/experiments/run.mjs`, followed by `node --test 05-authorization/tests/*.test.mjs`. **Expected:** read allowed, write/admin/cross-tenant denied. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Every path must mediate the actual object/action. **Limits:** workspace-specific sharing, ownership transfer and policy caches. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
