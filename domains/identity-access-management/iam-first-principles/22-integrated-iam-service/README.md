# 22. Compose authentication and policy

**Question:** Do independent IAM boundaries remain enforced in one application?

Read [master guide chapter 29](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 22-integrated-iam-service/tests/*.test.mjs
node 22-integrated-iam-service/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** accounts, sessions, tokens, memberships, connectors and audit. **Transition:** login, identify, authorize, refresh/revoke/provision. **Prediction/invariant:** real HTTP flow succeeds; unauthorized tenant/current membership fails. **Production lesson:** Use a mature IdP; the application still owns lifecycle and object policy.

Deliberately omitted: production persistence, passkey/MFA ceremonies, full OAuth/SCIM and HA. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
