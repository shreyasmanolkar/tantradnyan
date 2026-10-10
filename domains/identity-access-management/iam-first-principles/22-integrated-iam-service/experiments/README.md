# Experiment: Compose authentication and policy

**Hypothesis:** real HTTP flow succeeds; unauthorized tenant/current membership fails.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 22-integrated-iam-service/experiments/run.mjs`, followed by `node --test 22-integrated-iam-service/tests/*.test.mjs`. **Expected:** real HTTP flow succeeds; unauthorized tenant/current membership fails. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Use a mature IdP; the application still owns lifecycle and object policy. **Limits:** production persistence, passkey/MFA ceremonies, full OAuth/SCIM and HA. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
