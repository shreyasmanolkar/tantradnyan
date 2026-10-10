# Experiment: Request-bound service proofs

**Hypothesis:** body/audience/time mutation and duplicate nonce fail.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 20-workload-identity/experiments/run.mjs`, followed by `node --test 20-workload-identity/tests/*.test.mjs`. **Expected:** body/audience/time mutation and duplicate nonce fail. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Use standard message-signature libraries for deployed protocols. **Limits:** attestation issuer, full RFC 9421 canonicalization, mTLS mesh and replay-store expiry. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
