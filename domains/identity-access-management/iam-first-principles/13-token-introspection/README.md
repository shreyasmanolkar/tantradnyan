# 13. Opaque token state

**Question:** How does the recipient ask whether a credential is active now?

Read [master guide chapter 25](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 13-token-introspection/tests/*.test.mjs
node 13-token-introspection/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** opaque-secret digest with resource/audience/expiry. **Transition:** issue, introspect, revoke. **Prediction/invariant:** active before revocation; inactive afterward. **Production lesson:** Introspection cache lifetime limits prompt revocation.

Deliberately omitted: authenticated HTTP introspection endpoint and availability/cache policy. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
