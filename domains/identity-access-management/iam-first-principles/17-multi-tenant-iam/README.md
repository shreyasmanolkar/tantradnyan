# 17. Tenant state and PostgreSQL

**Question:** How do account, membership and resource checks stay independent?

Read [master guide chapter 22](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 17-multi-tenant-iam/tests/*.test.mjs
node 17-multi-tenant-iam/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** users, live memberships, tenant-composite resource keys. **Transition:** switch tenant, read scoped document, transact role change. **Prediction/invariant:** cross-tenant/stale/suspended/escalation cases denied. **Production lesson:** Encode containment in relational constraints and live queries.

Deliberately omitted: RLS, last-owner transfer, durable integrated app and workspace policy. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
