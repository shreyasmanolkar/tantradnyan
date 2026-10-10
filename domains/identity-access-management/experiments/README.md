# IAM experiment evidence

**Question:** do the stated IAM invariants hold for generated fixtures, local protocol services, PostgreSQL constraints and actual browser behavior?

**Hypothesis:** each mechanism preserves its stated context/binding invariant; current membership can deny an authenticated principal; logout invalidates continuity; code interception and refresh reuse cannot grant continued authority.

**Setup:** workstation Node 26.7.0/npm 11.19.0, OpenSSL, installed Chromium; locked JOSE/OIDC/SAML/PostgreSQL libraries. The local provider warns that Node 26 is not its recommended LTS runtime, and uses explicit development-only adapter/signing keys/interactions. Prefer a supported LTS for repeatability. Tests generate local secrets/one-day SAML certificates; mechanism time is logical seconds; HTTP/provider/browser tests also use real clocks/sockets. No performance claim is made.

**Drivers:** `npm test`, `npm run demo`, `npm run browser`, `npm run test:postgres` from the Node lab; root `python3 scripts/lab.py build` and `python3 scripts/lab.py check --generated`. Browser requires app and OP running; DB requires an explicit dedicated local scratch URL.

## Observed scope

- Node checks: 23 final tests passed: crypto/password/session/cookie/policy, API-key lifecycle, JWT negative profiles, real JWKS fetch, bound code/PKCE, local OP discovery/callback rejection, service-client rules, opaque introspection model, refresh reuse, RBAC/ABAC/ReBAC, tenant rules, signed SAML assertion acceptance/rejections, SCIM subset (including case-sensitive externalId), request signing, audit and real HTTP integration. The integration also rejects a provisioning-only account’s fixture-password login, separates tenant owner from platform key administration, and enforces the bounded login attempt limit.
- Real PostgreSQL: one integration test passed against a newly created isolated PostgreSQL 17.4 container. It exercises scoped joins, composite tenant constraints, revocation, suspension and transactional role authority. Existing application databases/containers were not modified. The unique test schema is removed by the driver; the scratch container was removed after final validation. Temporary app/provider processes were also stopped.
- Chromium browser: password login; actual HttpOnly/Lax cookie; A read allowed; B read denied; logout followed by /me 401; full local OP authorization-code+PKCE/state/nonce flow returns a linked Alice session; no page errors. HTTP loopback only, not an HTTPS deployment or SAML enterprise browser test.
- Demo runner: all 22 stage drivers completed. Stages 09/11/18/22 include sanitized transition/coverage summaries; actual protocol assertions are in their tests/browser checks, not inferred from printed instructions.

Final raw sanitized logs and command/environment metadata are under [results](results/). No passwords, raw session/access/refresh tokens, assertions or private keys are captured there. Test durations are runner diagnostics, not benchmark measurements.

## Failures that changed the implementation or validation

The first in-sandbox run could not bind local sockets; a permitted loopback run passed. Browser review found ambiguous tenant/document accessible labels; explicit labels fixed the controls before the successful review. The first OIDC browser driver omitted the development UI’s required dummy password field; filling it allowed the actual login round-trip. The browser connector lacked its configured Chrome distribution; the installed Chromium and Playwright driver supplied a local fallback.

The first scratch PostgreSQL startup listened only on container loopback; it was replaced with an explicitly configured scratch container before the passing check. Catalog validation initially traversed installed dependency Markdown and reported upstream-package links; the checker now skips node_modules docs, with a regression test retaining authored-link failures. These failures are validation/setup findings, not invented protocol security results.

**Explanation:** authenticated bytes, transaction correlation, current authority and lifecycle revocation solve separate problems. The valid-JWT-after-refresh-revocation test is an intentional counterexample to immediate stateless revocation.

**Limits/not run:** production IdP/provider adapter, durable integrated persistence, passkey/MFA ceremony implementation, HTTPS/proxy deployment, SAML real-IdP browser round-trip, full SCIM/OAuth conformance, multi-process refresh races, distributed cache propagation, RLS, outage acceptance suite and compliance assessment. Proposed exercises/challenges are not marked observed.

**Next experiment:** serialize two refresh requests in a real PostgreSQL transaction and verify reuse revocation commits, then add a durable provisioning outbox and measure an explicitly bounded offboarding test without relying on JWT expiry alone.
