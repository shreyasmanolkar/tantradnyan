# Experiment: Tenant state and PostgreSQL

**Hypothesis:** cross-tenant/stale/suspended/escalation cases denied.

**Setup:** generated local fixtures; trusted sources and state described in [the walkthrough](../GUIDE.md). **Driver:** from lab root, `node 17-multi-tenant-iam/experiments/run.mjs`, followed by `node --test 17-multi-tenant-iam/tests/*.test.mjs`. **Expected:** cross-tenant/stale/suspended/escalation cases denied. **Actual:** see [central run evidence](../../../experiments/README.md); this page does not claim the learner ran it. **Explanation:** Encode containment in relational constraints and live queries. **Limits:** RLS, last-owner transfer, durable integrated app and workspace policy. **Next:** change one caller-controlled input or one timing/lifecycle assumption and seek a counterexample.
