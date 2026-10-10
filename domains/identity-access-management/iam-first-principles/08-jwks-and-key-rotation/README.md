# 08. Trusted keys and rollover

**Question:** How do recipients find issuer keys without trusting token-supplied URLs?

Read [master guide chapter 13](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 08-jwks-and-key-rotation/tests/*.test.mjs
node 08-jwks-and-key-rotation/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** old/new public JWKs, trusted endpoint/cache. **Transition:** publish overlap, resolve kid, retire. **Prediction/invariant:** old key valid during overlap, rejected after retirement. **Production lesson:** Cache policy changes compromise revocation latency.

Deliberately omitted: HTTP cache outage matrix, emergency distributed eviction and rate-limit tuning. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
