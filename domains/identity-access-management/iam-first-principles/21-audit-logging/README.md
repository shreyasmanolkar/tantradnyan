# 21. Accountable security decisions

**Question:** How do logs preserve useful evidence without exposing credentials?

Read [master guide chapter 27](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 21-audit-logging/tests/*.test.mjs
node 21-audit-logging/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** allowlisted event fields, previous tag, audit key. **Transition:** redact by selection, chain HMAC, verify. **Prediction/invariant:** secret fields omitted; edited event detected. **Production lesson:** Chain does not prove delivery, prevent key-holder rewrite or anchored truncation.

Deliberately omitted: durable sink, signed checkpoints, compliance assessment and retention policy. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
