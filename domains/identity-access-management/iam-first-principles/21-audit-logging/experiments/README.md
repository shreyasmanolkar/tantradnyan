# Experiment: Accountable security decisions

**Hypothesis:** secret fields omitted; edited event detected.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 21-audit-logging/experiments/run.mjs`, followed by `node --test 21-audit-logging/tests/*.test.mjs`. **Expected:** secret fields omitted; edited event detected. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Chain does not prove delivery, prevent key-holder rewrite or anchored truncation. **Limits:** durable sink, signed checkpoints, compliance assessment and retention policy. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
