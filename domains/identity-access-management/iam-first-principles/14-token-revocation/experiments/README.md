# Experiment: Refresh families and staleness

**Hypothesis:** reused parent revokes child; old JWT locally still validates.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 14-token-revocation/experiments/run.mjs`, followed by `node --test 14-token-revocation/tests/*.test.mjs`. **Expected:** reused parent revokes child; old JWT locally still validates. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Commit security revocation before returning a replay error. **Limits:** distributed locking, grace windows and durable consumed-token tombstones. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
