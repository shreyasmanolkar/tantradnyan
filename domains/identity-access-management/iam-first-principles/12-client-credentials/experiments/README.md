# Experiment: Service client authentication

**Hypothesis:** wrong secret/audience/scope rejected.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 12-client-credentials/experiments/run.mjs`, followed by `node --test 12-client-credentials/tests/*.test.mjs`. **Expected:** wrong secret/audience/scope rejected. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Client identity does not imply a user delegation. **Limits:** wire-level grant endpoint, private-key JWT/mTLS integration and secret distribution. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
