# Experiment: Opaque token state

**Hypothesis:** active before revocation; inactive afterward.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 13-token-introspection/experiments/run.mjs`, followed by `node --test 13-token-introspection/tests/*.test.mjs`. **Expected:** active before revocation; inactive afterward. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Introspection cache lifetime limits prompt revocation. **Limits:** authenticated HTTP introspection endpoint and availability/cache policy. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
