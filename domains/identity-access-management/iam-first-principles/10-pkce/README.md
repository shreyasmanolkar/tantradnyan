# 10. Code interception and PKCE

**Question:** Why can a stolen code be insufficient for redemption?

Read [master guide chapter 16](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 10-pkce/tests/*.test.mjs
node 10-pkce/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** fresh verifier, S256 challenge, bound code. **Transition:** hash challenge, validate verifier, consume. **Prediction/invariant:** RFC vector matches; attacker without verifier fails. **Production lesson:** PKCE proves transaction-secret possession, not global application identity.

Deliberately omitted: client compromise, XSS prevention and OS redirect registration. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
