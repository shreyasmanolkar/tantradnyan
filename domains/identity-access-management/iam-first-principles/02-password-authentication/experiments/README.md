# Experiment: Password verifiers

**Hypothesis:** same password has different salted records; wrong password fails.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 02-password-authentication/experiments/run.mjs`, followed by `node --test 02-password-authentication/tests/*.test.mjs`. **Expected:** same password has different salted records; wrong password fails. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Limit guessing and hashing concurrency; choose measured costs. **Limits:** breach screening, pepper, reset/recovery, WebAuthn and deployment benchmarking. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
