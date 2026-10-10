# Experiment: Trusted keys and rollover

**Hypothesis:** old key valid during overlap, rejected after retirement.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 08-jwks-and-key-rotation/experiments/run.mjs`, followed by `node --test 08-jwks-and-key-rotation/tests/*.test.mjs`. **Expected:** old key valid during overlap, rejected after retirement. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Cache policy changes compromise revocation latency. **Limits:** HTTP cache outage matrix, emergency distributed eviction and rate-limit tuning. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
