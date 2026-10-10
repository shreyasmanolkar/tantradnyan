# 01. Cryptographic guarantees

**Question:** Which authenticated bytes and trusted keys justify a request?

Read [master guide chapter 3](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 01-cryptography/tests/*.test.mjs
node 01-cryptography/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** message, keys, nonce. **Transition:** sign/verify and AEAD encrypt/decrypt. **Prediction/invariant:** altered tenant/action fails verification. **Production lesson:** Do not interpret authentic bytes as current permission.

Deliberately omitted: PKI path building, deployment key custody and side channels. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
