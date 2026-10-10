# IAM teaching boundaries

Keep the [master guide](GUIDE.md) progressive: resources/principals/credentials/sessions/policy precede token and federation protocols. Preserve supplied docs/references transcripts and personal notes. Never promote local models to production protocol claims.

Use maintained JOSE/OIDC/SAML libraries for actual crypto/protocol parsing. Failure experiments use generated fixtures and loopback only. Never log credential values. Keep explicit tenant/current-membership checks separate from authentication.

Checks: `npm test` and `npm run demo` in iam-first-principles; `npm run browser` requires the local app/provider and installed Chromium. PostgreSQL changes require `npm run test:postgres` with an explicit dedicated local IAM_DATABASE_URL. Report each scope and any unrun deployment work. Run root catalog build/check after navigation edits. Do not mark learner milestones verified.
