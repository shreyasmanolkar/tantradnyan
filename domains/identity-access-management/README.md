# Identity and access management

**Learner question:** How can a system establish who or what is making a request, decide what that entity may do, and enforce/revoke that authority across application, API, workload and enterprise boundaries?

Start with the [30-chapter master guide](GUIDE.md). It derives identity, authenticators, sessions and policy before delegation, tokens, OAuth/PKCE, OIDC, SAML, SSO and SCIM. Then use [36 exercises](EXERCISES.md), [eight worked enterprise challenges](DESIGN-CHALLENGES.md), [the threat workbook](THREATS.md) and [PostgreSQL state design](DATA-MODEL.md).

The [22-stage Node lab](iam-first-principles/README.md) provides cryptographic/signature failures, browser sessions, tenant authorization, JOSE/JWKS, code/PKCE/refresh models, a real local OIDC provider/RP, signed SAML fixtures, SCIM Users/Groups and revocation, non-human request proofs and audit. The [integrated SaaS project](../../projects/iam-saas/README.md) composes selected boundaries on loopback.

```sh
cd domains/identity-access-management/iam-first-principles
npm ci
npm test
npm run demo
```

The supplied transcripts are preserved in `docs/references`; `docs/resources` was absent. [Their detailed review](references/LOCAL-NOTES-REVIEW.md) corrects unsupported/unsafe generalizations against [primary standards](references/README.md). [Evidence](experiments/README.md) distinguishes actual Node, PostgreSQL and browser validation from designs/omissions. No outcome is marked personally verified for the learner.
