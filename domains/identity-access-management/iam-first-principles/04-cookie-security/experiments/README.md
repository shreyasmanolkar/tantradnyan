# Experiment: Cookie and CSRF boundaries

**Hypothesis:** foreign Origin or wrong proof is denied.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 04-cookie-security/experiments/run.mjs`, followed by `node --test 04-cookie-security/tests/*.test.mjs`. **Expected:** foreign Origin or wrong proof is denied. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** HttpOnly does not stop XSS actions; SameSite does not replace CSRF. **Limits:** full browser cookie engine, CORS server policy and HTTPS deployment. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
