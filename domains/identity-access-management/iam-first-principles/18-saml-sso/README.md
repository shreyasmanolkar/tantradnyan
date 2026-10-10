# 18. Signed XML federation

**Question:** Which assertion can the service provider actually trust?

Read [master guide chapter 19](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 18-saml-sso/tests/*.test.mjs
node 18-saml-sso/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** pinned issuer/cert, request cache, signed assertion/response. **Transition:** request, verify signed content, check recipient, consume request. **Prediction/invariant:** valid fixture accepted; replay/tamper/wrong recipient fails. **Production lesson:** Signature over some XML is insufficient; consume validated content.

Deliberately omitted: production IdP/HTTPS browser setup, encrypted assertions and Single Logout. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
