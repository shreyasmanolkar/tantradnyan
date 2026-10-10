# Experiment: Revocable sessions

**Hypothesis:** pre-login ID and logged-out ID stop resolving.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 03-session-authentication/experiments/run.mjs`, followed by `node --test 03-session-authentication/tests/*.test.mjs`. **Expected:** pre-login ID and logged-out ID stop resolving. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Invalidate server state as well as cookie. **Limits:** persistent/distributed store, device inventory and assurance policies. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
