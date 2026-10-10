# 15. Role inheritance and assignment

**Question:** Why is assigning a role itself a privileged action?

Read [master guide chapter 9](../../GUIDE.md) and this [walkthrough](GUIDE.md). Source: [model](src/model.mjs); failure checks: [tests](tests/). This stage exposes one bounded mechanism; its successful tests do not establish production protocol conformance.

From the lab directory:

```sh
npm ci
node --test 15-rbac/tests/*.test.mjs
node 15-rbac/experiments/run.mjs
```

Node 22.14+ LTS recommended. Stages 08/11/22 bind loopback sockets; stage 18 additionally needs OpenSSL for ephemeral test certificates. Stage 17 PostgreSQL is a separate explicit `npm run test:postgres` check. Assumptions: local fixtures, no real identities, explicit logical time where supplied; mature libraries handle JWT/OIDC/SAML. Runtime dependencies and lockfile live in the lab root; a stage copied alone needs that package context.

**State:** role graph, permissions, actor/target role. **Transition:** expand acyclic hierarchy, constrain assignment. **Prediction/invariant:** inheritance works; cycle/self-escalation denied. **Production lesson:** Administrative role changes need their own scoped authority.

Deliberately omitted: full custom-role persistence, ownership transfer and approval workflows. See [experiment record](experiments/README.md) and [domain evidence](../../experiments/README.md) for observed versus predicted results.
