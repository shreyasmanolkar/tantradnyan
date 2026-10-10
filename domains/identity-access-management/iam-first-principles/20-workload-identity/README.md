# 20. Request-bound service proofs

**Question:** Why do signatures need replay state and audience constraints?

Read [master guide chapter 23](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 20-workload-identity/tests/*.test.mjs
node 20-workload-identity/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** service key, canonical bytes, nonce set, time. **Transition:** sign covered request, validate, consume nonce. **Prediction/invariant:** body/audience/time mutation and duplicate nonce fail. **Production lesson:** Use standard message-signature libraries for deployed protocols.

Deliberately omitted: attestation issuer, full RFC 9421 canonicalization, mTLS mesh and replay-store expiry. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
