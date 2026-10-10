# Experiment: JWT validation profiles

**Hypothesis:** tampered claim/wrong issuer/audience/algorithm/time fails.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 07-jwt/experiments/run.mjs`, followed by `node --test 07-jwt/tests/*.test.mjs`. **Expected:** tampered claim/wrong issuer/audience/algorithm/time fails. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Fix algorithm/profile independently of untrusted token header. **Limits:** complete RFC 9068 issuer, encryption, hardware key custody. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
