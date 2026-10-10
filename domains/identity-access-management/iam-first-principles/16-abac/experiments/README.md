# Experiment: Attributes and relationships

**Hypothesis:** stale step-up, other tenant, unknown relation denied.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 16-abac/experiments/run.mjs`, followed by `node --test 16-abac/tests/*.test.mjs`. **Expected:** stale step-up, other tenant, unknown relation denied. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Protect attribute provenance and graph/cache freshness. **Limits:** full ReBAC language, distributed tuple service and dynamic policies. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
