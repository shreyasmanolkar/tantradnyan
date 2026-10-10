# 02. Password verifiers

**Question:** Why must password verifiers be costly while session tokens need unpredictability?

Read [master guide chapter 4](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 02-password-authentication/tests/*.test.mjs
node 02-password-authentication/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** password, random salt, cost record. **Transition:** KDF enrollment then constant-time comparison. **Prediction/invariant:** same password has different salted records; wrong password fails. **Production lesson:** Limit guessing and hashing concurrency; choose measured costs.

Deliberately omitted: breach screening, pepper, reset/recovery, WebAuthn and deployment benchmarking. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
