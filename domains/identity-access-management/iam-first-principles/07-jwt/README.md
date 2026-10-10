# 07. JWT validation profiles

**Question:** Why does parsing claims not establish trust?

Read [master guide chapter 12](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 07-jwt/tests/*.test.mjs
node 07-jwt/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** RS256 key pair, signed claims, configured validation profile. **Transition:** issue, decode, validate. **Prediction/invariant:** tampered claim/wrong issuer/audience/algorithm/time fails. **Production lesson:** Fix algorithm/profile independently of untrusted token header.

Deliberately omitted: complete RFC 9068 issuer, encryption, hardware key custody. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
