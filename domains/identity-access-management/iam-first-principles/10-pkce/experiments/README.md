# Experiment: Code interception and PKCE

**Hypothesis:** RFC vector matches; attacker without verifier fails.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 10-pkce/experiments/run.mjs`, followed by `node --test 10-pkce/tests/*.test.mjs`. **Expected:** RFC vector matches; attacker without verifier fails. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** PKCE proves transaction-secret possession, not global application identity. **Limits:** client compromise, XSS prevention and OS redirect registration. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
