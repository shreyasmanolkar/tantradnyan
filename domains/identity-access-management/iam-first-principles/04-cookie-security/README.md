# 04. Cookie and CSRF boundaries

**Question:** Why can a browser send a credential without proving user intent?

Read [master guide chapter 7](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 04-cookie-security/tests/*.test.mjs
node 04-cookie-security/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** origin, CSRF proof, cookie policy. **Transition:** compare origin plus session-bound proof. **Prediction/invariant:** foreign Origin or wrong proof is denied. **Production lesson:** HttpOnly does not stop XSS actions; SameSite does not replace CSRF.

Deliberately omitted: full browser cookie engine, CORS server policy and HTTPS deployment. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
