# Experiment: Provisioning and offboarding

**Hypothesis:** atomic failure, stale ETag and foreign tenant rejected.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 19-scim-provisioning/experiments/run.mjs`, followed by `node --test 19-scim-provisioning/tests/*.test.mjs`. **Expected:** atomic failure, stale ETag and foreign tenant rejected. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** SCIM updates policy input; runtime access revocation is separate. **Limits:** full schema/filter/PATCH support, PUT/DELETE/Bulk and durable reconciliation. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
