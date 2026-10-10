# 03. Revocable sessions

**Question:** How does a past login establish bounded continuity?

Read [master guide chapter 6](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 03-session-authentication/tests/*.test.mjs
node 03-session-authentication/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** digest-indexed session rows, explicit clock. **Transition:** issue, rotate, resolve, expire, revoke. **Prediction/invariant:** pre-login ID and logged-out ID stop resolving. **Production lesson:** Invalidate server state as well as cookie.

Deliberately omitted: persistent/distributed store, device inventory and assurance policies. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
