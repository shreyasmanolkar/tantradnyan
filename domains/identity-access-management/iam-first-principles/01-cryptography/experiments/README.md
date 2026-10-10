# Experiment: Cryptographic guarantees

**Hypothesis:** altered tenant/action fails verification.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 01-cryptography/experiments/run.mjs`, followed by `node --test 01-cryptography/tests/*.test.mjs`. **Expected:** altered tenant/action fails verification. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Do not interpret authentic bytes as current permission. **Limits:** PKI path building, deployment key custody and side channels. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
