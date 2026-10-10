# 11. Real local OIDC login

**Question:** What evidence authenticates a user to a relying party?

Read [master guide chapter 17](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 11-oidc-relying-party/tests/*.test.mjs
node 11-oidc-relying-party/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** trusted OP configuration, browser transaction, state/nonce/verifier. **Transition:** discover, authorize, redeem, validate ID token, link issuer/subject. **Prediction/invariant:** fabricated callback denied; documented browser flow succeeds. **Production lesson:** Use mature protocol library, retain local account/policy responsibility.

Deliberately omitted: production provider adapter, authenticator enrollment and federated logout. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
