# IAM first-principles laboratory

Twenty-two progressive mechanisms complement [the master guide](../GUIDE.md). Start from a resource boundary, then credentials/sessions/policy, then delegation/federation/provisioning. No external identity account is required. Dependencies are local and locked; JOSE/OIDC/SAML use maintained implementations.

```sh
cd domains/identity-access-management/iam-first-principles
npm ci
npm test
npm run demo
# two terminals for real local OIDC browser login:
npm run oidc
npm run serve
# with both running and Chromium installed:
npm run browser
```

Use Node 22.14+ LTS or a compatible later LTS and OpenSSL. The app uses http://127.0.0.1:3000; OP uses port 3001. Development OP UI accepts login alice and any nonempty dummy password; approve Continue. Credentials are fixtures, never real accounts. `IAM_CHROMIUM` overrides `/usr/bin/chromium` for browser review. Tests use logical time and generated random secrets/keys; no performance figures are inferred.

## Stages

1. [Cryptographic guarantees](01-cryptography/README.md): Which authenticated bytes and trusted keys justify a request?
2. [Password verifiers](02-password-authentication/README.md): Why must password verifiers be costly while session tokens need unpredictability?
3. [Revocable sessions](03-session-authentication/README.md): How does a past login establish bounded continuity?
4. [Cookie and CSRF boundaries](04-cookie-security/README.md): Why can a browser send a credential without proving user intent?
5. [Default-deny authorization](05-authorization/README.md): Does an authenticated viewer have authority for this document/action?
6. [API credential lifecycle](06-api-keys/README.md): What does possession of an integration key establish?
7. [JWT validation profiles](07-jwt/README.md): Why does parsing claims not establish trust?
8. [Trusted keys and rollover](08-jwks-and-key-rotation/README.md): How do recipients find issuer keys without trusting token-supplied URLs?
9. [Bound authorization codes](09-oauth-authorization-code/README.md): How does a one-use grant reach the correct client?
10. [Code interception and PKCE](10-pkce/README.md): Why can a stolen code be insufficient for redemption?
11. [Real local OIDC login](11-oidc-relying-party/README.md): What evidence authenticates a user to a relying party?
12. [Service client authentication](12-client-credentials/README.md): Who acts when there is no human login?
13. [Opaque token state](13-token-introspection/README.md): How does the recipient ask whether a credential is active now?
14. [Refresh families and staleness](14-token-revocation/README.md): What changes when renewal is revoked but a signed token still exists?
15. [Role inheritance and assignment](15-rbac/README.md): Why is assigning a role itself a privileged action?
16. [Attributes and relationships](16-abac/README.md): Which trusted facts or relationships justify an action now?
17. [Tenant state and PostgreSQL](17-multi-tenant-iam/README.md): How do account, membership and resource checks stay independent?
18. [Signed XML federation](18-saml-sso/README.md): Which assertion can the service provider actually trust?
19. [Provisioning and offboarding](19-scim-provisioning/README.md): How does a lifecycle change become an effective access change?
20. [Request-bound service proofs](20-workload-identity/README.md): Why do signatures need replay state and audience constraints?
21. [Accountable security decisions](21-audit-logging/README.md): How do logs preserve useful evidence without exposing credentials?
22. [Compose authentication and policy](22-integrated-iam-service/README.md): Do independent IAM boundaries remain enforced in one application?

## Implementation and integration boundaries

| Layer | Available evidence | Deliberate boundary |
| --- | --- | --- |
| crypto/password/session/policy/key/refresh/opaque/service/audit | executable Node models and negative tests | memory state, logical clocks, no production concurrency/durability claim |
| JWT/JWKS | jose signing/verification + real remote loopback key fetch | teaching profile, not complete RFC 9068 issuer |
| OAuth/PKCE | code store and integrated HTTP exercise | JSON teaching adapter and fixed fixture client; mature OP supplies standards wire endpoints |
| OIDC | mature local OP/RP, discovery/negative tests and full browser login | development UI/keys/in-memory adapter, no production authenticators |
| SAML | node-saml SP + xml-crypto signed fixtures, recipient/audience/replay failure checks | synthetic IdP fixtures; enterprise browser flow requires HTTPS/configuration, not claimed run |
| SCIM | Users/Groups/filter subset/PATCH/ETag/deactivation + HTTP app handler | omitted PUT/DELETE/Bulk/full filter/schema support; not full conformance |
| multi-tenant persistence | real PostgreSQL schema and authorized queries/transactions tested separately | integrated app remains in-memory; no RLS or durable provider adapter |
| integrated app | password login, sessions, REST resource policy, teaching code/refresh/rotation, OIDC RP, SCIM and audit | no HA, production recovery/MFA/approval ceremonies or complete protocol platform |

For real persistence testing use a **dedicated local learning database**:

```sh
IAM_DATABASE_URL='postgres://iam_lab:example-only@127.0.0.1:5432/iam_lab' npm run test:postgres
```

This command creates/drops only a unique test schema. It requires an explicit URL and fails if absent; it does not silently skip persistence. See [database design](../DATA-MODEL.md), [project boundaries](../../../projects/iam-saas/README.md), [exercise predictions](../EXERCISES.md) and [observed evidence](../experiments/README.md).
