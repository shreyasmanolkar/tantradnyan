# 16. Attributes and relationships

**Question:** Which trusted facts or relationships justify an action now?

Read [master guide chapter 9](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 16-abac/tests/*.test.mjs
node 16-abac/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** tenant/department/clearance, auth context, bounded tuple graph. **Transition:** evaluate predicates, traverse parent reader edges. **Prediction/invariant:** stale step-up, other tenant, unknown relation denied. **Production lesson:** Protect attribute provenance and graph/cache freshness.

Deliberately omitted: full ReBAC language, distributed tuple service and dynamic policies. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
