# 06. API credential lifecycle

**Question:** What does possession of an integration key establish?

Read [master guide chapter 10](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 06-api-keys/tests/*.test.mjs
node 06-api-keys/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** key ID and random-secret digest, scopes/audience/expiry. **Transition:** issue, validate, revoke. **Prediction/invariant:** wrong audience, expiry and revoked key fail. **Production lesson:** Scope and object policy are separate from credential validation.

Deliberately omitted: key distribution UI, compromise detection and HTTP middleware. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
