# 05. Default-deny authorization

**Question:** Does an authenticated viewer have authority for this document/action?

Read [master guide chapter 9](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 05-authorization/tests/*.test.mjs
node 05-authorization/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** principal, stored tenant, membership, role permissions. **Transition:** check status and containment then evaluate action. **Prediction/invariant:** read allowed, write/admin/cross-tenant denied. **Production lesson:** Every path must mediate the actual object/action.

Deliberately omitted: workspace-specific sharing, ownership transfer and policy caches. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
