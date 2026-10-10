# Experiment: Signed XML federation

**Hypothesis:** valid fixture accepted; replay/tamper/wrong recipient fails.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 18-saml-sso/experiments/run.mjs`, followed by `node --test 18-saml-sso/tests/*.test.mjs`. **Expected:** valid fixture accepted; replay/tamper/wrong recipient fails. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Signature over some XML is insufficient; consume validated content. **Limits:** production IdP/HTTPS browser setup, encrypted assertions and Single Logout. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
