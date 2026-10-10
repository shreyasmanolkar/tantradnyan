# Experiment: API credential lifecycle

**Hypothesis:** wrong audience, expiry and revoked key fail.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 06-api-keys/experiments/run.mjs`, followed by `node --test 06-api-keys/tests/*.test.mjs`. **Expected:** wrong audience, expiry and revoked key fail. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Scope and object policy are separate from credential validation. **Limits:** key distribution UI, compromise detection and HTTP middleware. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
