# 09. Bound authorization codes

**Question:** How does a one-use grant reach the correct client?

Read [master guide chapter 14](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 09-oauth-authorization-code/tests/*.test.mjs
node 09-oauth-authorization-code/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** registered client, redirect/scopes, code digest/bindings. **Transition:** consent, issue, check, consume. **Prediction/invariant:** wrong client/redirect/scope/time or second redemption fails. **Production lesson:** Atomic consumption and exact registration protect distinct bindings.

Deliberately omitted: complete OAuth HTTP serialization, UI/client registry and distributed transactions. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
