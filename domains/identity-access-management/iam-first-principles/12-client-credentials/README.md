# 12. Service client authentication

**Question:** Who acts when there is no human login?

Read [master guide chapter 23](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 12-client-credentials/tests/*.test.mjs
node 12-client-credentials/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** client secret digest, audience, allowed scopes. **Transition:** register, authenticate, constrain. **Prediction/invariant:** wrong secret/audience/scope rejected. **Production lesson:** Client identity does not imply a user delegation.

Deliberately omitted: wire-level grant endpoint, private-key JWT/mTLS integration and secret distribution. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
