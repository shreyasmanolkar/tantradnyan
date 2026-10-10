# 14. Refresh families and staleness

**Question:** What changes when renewal is revoked but a signed token still exists?

Read [master guide chapter 25](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 14-token-revocation/tests/*.test.mjs
node 14-token-revocation/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** token digest lineage, family client/absolute expiry. **Transition:** rotate parent once, detect reuse, revoke family. **Prediction/invariant:** reused parent revokes child; old JWT locally still validates. **Production lesson:** Commit security revocation before returning a replay error.

Deliberately omitted: distributed locking, grace windows and durable consumed-token tombstones. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
