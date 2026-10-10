# A bounded IAM platform and protected SaaS app

**Goal:** observe credential verification, session continuity, tenant policy, API token validation, federation and provisioning as separate responsibilities. Follow [the IAM curriculum](../../domains/identity-access-management/GUIDE.md) and [22 mechanism stages](../../domains/identity-access-management/iam-first-principles/README.md).

## Run

```sh
cd domains/identity-access-management/iam-first-principles
npm ci
npm run serve
# another terminal in the same directory:
npm run oidc
```

Open http://127.0.0.1:3000. Fixtures: alice@example.invalid owns A; bob@example.invalid views B; both use `example-only long passphrase`. Passwords are scrypt-verifier records. Choose A/doc-a as Alice and expect a read; choose B/doc-b and expect unavailable; revoke the session and expect /me to return 401. Inspect the request trace, which redacts CSRF values and contains no bearer secrets.

OIDC login uses a separate mature local OP on 3001. Its development UI accepts login `alice` and any nonempty dummy password, then Continue; these are not validated authenticators. The RP performs code+PKCE, signature/issuer/audience/time/nonce/state checks and creates a local session only for the exact configured linked issuer/subject. It does not link by email. This provider uses development keys and memory storage intentionally.

## Responsibilities and endpoints

```text
local password verifier OR trusted local OP assertion
 → new application session → principal resolution
 → current account + membership + resource tenant + action
 → REST resource → audit

SCIM connector → local lifecycle/membership state → revocation effects
teaching OAuth code + PKCE → API access token → same current policy
```

| Handler | Behavior and security boundary |
| --- | --- |
| POST /register | creates account with password verifier; no tenant rights; Origin check |
| POST /login, GET /me, POST /logout | generic credential failure, five attempts/minute per address+account model, session rotation, CSRF, invalidation |
| GET /api/documents/:id?tenant= | cookie or access token; current account/membership/resource checks; no claimed-role bypass |
| POST /authorize, POST /token | fixture public client, explicit consent, registered redirect, S256, bound one-use code; refresh-family rotation/reuse detection |
| POST /revoke | removes refresh-family renewal; already-issued ATs are a separate lifecycle |
| GET /jwks, POST /admin/rotate | public verification keys and fixture platform-admin/CSRF-protected rollover with overlap |
| GET /oidc/login, GET /oidc/callback | mature RP flow, browser transaction expiry/consumption; local session afterward |
| /scim/v2/Users, /scim/v2/Groups | tenant-A-bound bearer connector; create/list/get/subset PATCH, ETags and deactivation hook |
| /saml/login, /saml/acs | optional supplied node-saml adapter; signed validated assertion + browser-bound relay; HTTPS required for None/Secure POST cookie |

The local JSON `/authorize` returns code/state rather than being a complete OAuth browser endpoint. It exposes state transitions for tests; use the mature OP’s discovered endpoints for standard OAuth/OIDC wire flows. Registration has no email proofing/recovery or tenant assignment. In-memory abuse state is not a production distributed rate limiter. Sessions/grants/keys/logs reset on restart. Alice is separately present in a fixture platform-admin set for the key-rotation exercise; a tenant owner role alone never grants issuer-wide key administration.

SCIM user creation maps a server SCIM ID to a distinct local account with a viewer membership. It does not merge by email. No password is enrolled for a SCIM-created account; the fixture password must **not** authenticate it. Deactivation revokes mapped membership and conservatively all sessions/refresh families for that account. Re-activation/group-to-role mapping is a design extension, not implied completed behavior. Unsupported SCIM paths/operators fail explicitly.

SAML library integration has real signed-fixture tests, not a full browser-tested enterprise provider. To deploy the optional adapter, supply a tenant-configured `serviceProvider` to `createApp({origin:'https://localhost:…',saml})`, serve the returned listener through a correctly configured HTTPS reverse proxy, register the exact ACS and populate approved external-identity links through reviewed application code. This is an integration adapter, not a turnkey SAML deployment. See [stage 18](../../domains/identity-access-management/iam-first-principles/18-saml-sso/README.md).

## Verification and omissions

```sh
# from the Node lab directory
npm test
npm run demo
# app + OP running, installed Chromium:
npm run browser
# separate dedicated local PostgreSQL database:
IAM_DATABASE_URL='postgres://iam_lab:example-only@127.0.0.1:5432/iam_lab' npm run test:postgres
```

The HTTP integration test covers login/CSRF, tenant denial, code/refresh, replay-family removal, signing-key overlap, SCIM/deactivation and logout, with redacted audit checks. Browser review covers actual cookie attachment, controls, denied access, logout and full local OIDC round-trip. PostgreSQL constraints/queries are tested separately from the app’s memory state. [Evidence](../../domains/identity-access-management/experiments/README.md) states observed scope.

This is an educational reference, not a production-grade IdP. Omitted: durable provider/application adapters, full OAuth/SCIM/SAML conformance, authenticator recovery, implemented passkeys/MFA, granular SCIM group role mapping, high availability, distributed race/cache handling, durable audit sink, last-owner/approval workflows and production secret management. Browser HTTP loopback does not establish HTTPS deployment correctness. Mature providers own production authenticators/protocol endpoints/key lifecycle; the SaaS still owns account linking, memberships, object policy and provisioning consequences.
