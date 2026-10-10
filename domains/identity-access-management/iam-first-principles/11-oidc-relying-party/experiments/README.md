# Experiment: Real local OIDC login

**Hypothesis:** fabricated callback denied; documented browser flow succeeds.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 11-oidc-relying-party/experiments/run.mjs`, followed by `node --test 11-oidc-relying-party/tests/*.test.mjs`. **Expected:** fabricated callback denied; documented browser flow succeeds. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Use mature protocol library, retain local account/policy responsibility. **Limits:** production provider adapter, authenticator enrollment and federated logout. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
