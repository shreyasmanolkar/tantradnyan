# 19. Provisioning and offboarding

**Question:** How does a lifecycle change become an effective access change?

Read [master guide chapter 20](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 19-scim-provisioning/tests/*.test.mjs
node 19-scim-provisioning/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** tenant resources, versions, groups, deactivation callback. **Transition:** create/list/filter/PATCH/version/deactivate. **Prediction/invariant:** atomic failure, stale ETag and foreign tenant rejected. **Production lesson:** SCIM updates policy input; runtime access revocation is separate.

Deliberately omitted: full schema/filter/PATCH support, PUT/DELETE/Bulk and durable reconciliation. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
