# Enterprise design challenges and worked solutions

Continue from [the master guide](GUIDE.md). For each challenge, first sketch principals, messages and enforcement points without reading the solution. State measurable acceptance conditions. Solutions below are architectural recommendations, not vendor claims. The Node tests cover named bounded invariants; additional acceptance tests are specified as exercises, not silently claimed as implemented.

## A. Conventional SaaS

**Requirements:** local email/password or passkey login, private documents, organizations and distinct member roles. **Threats:** phishing, credential stuffing, fixation, CSRF, IDOR and stale rights.

**Identity:** stable user ID plus mutable verified contact; membership keyed by user/organization; separate authenticators and sessions. **Flow:** enroll credential → verify login → rotate session → resolve principal → query current membership and resource tenant → evaluate document action → audit. Reauthentication gates password changes, recovery settings and ownership transfer.

**Policy:** default deny; viewer reads, editor writes, administrator manages bounded membership, owner transfers ownership. A document owner still needs active tenant membership. **State:** users, memberships, workspaces, documents, password verifiers, session digests, invitations, audit. Use composite tenant foreign keys and parameterized queries. **Session:** HttpOnly Secure host cookie, CSRF proof, idle and absolute deadlines; no browser access token is needed for the same-origin app.

**Standards:** WebAuthn for passkeys; OIDC only if federation is added. **Failure:** generic credential errors, throttling, no session on validation failure; session-store outage denies authenticated requests unless a documented bounded cache exists. **Audit:** login, revoke, invite, role/owner changes, privileged decisions. **Trade-off:** session state adds storage/availability work but simplifies immediate revocation. **Tests:** stage 03/05/17/22 plus browser login/read/deny/logout; add account recovery and last-owner concurrency tests before implementing those features.

## B. Public customer-authorized API

**Requirements:** third-party developers access only customer-approved data, revoke grants, isolate apps/tenants. **Threats:** code interception, redirect injection, token theft, confused deputy and scope overreach.

**Identity:** developer client registration, customer principal, organization membership and explicit authorization grant. Public versus confidential client is determined by secret-holding ability. **Flow:** register exact callback → code+PKCE transaction → authenticate customer → display client/resource/scopes → consent → one-use code exchange → audience-bound token → object-level authorization. Do not request the customer password in the integration.

**Policy:** allowed action = scope ∩ current grant ∩ current membership/resource policy. **State:** OAuth clients, authorization grants/codes, refresh families and consumed-token tombstones, credential inventory, audit. **Token:** short AT; opaque/introspection if immediate central control is required, or JWT plus online policy with explicit stale bounds. RT rotation/client binding and absolute family expiry; least-privilege per app.

**Standards:** OAuth code, PKCE, metadata, resource indicators; OIDC only when the client needs authentication claims. **Failure:** reject unknown callbacks without redirecting; revoke family on reuse; constrain unknown-key refresh. **Audit:** consent/grant changes, token issuance/reuse, API denial and credential rotations. **Trade-off:** developer UX and offline validation versus promptly revocable state. **Tests:** stages 07–10/14/22; add two clients and attempt code substitution, scope increase during refresh and grant revocation with an already-issued token.

## C. Enterprise SSO

**Requirements:** corporate users must authenticate through organization-approved IdPs; multiple providers/guest exceptions need explicit policy. **Threats:** wrong issuer, account-link takeover, IdP compromise, weaker fallback login, assertion replay.

**Identity:** local user linked by provider+subject; provider scoped to organization; membership provisioned or explicitly invited. Email domain only routes discovery. **Flow:** trusted organization/provider selection → browser-bound request → validate OIDC ID token or SAML response → resolve linked account → enforce tenant-specific SSO/assurance → create local session → local resource policy. Configuration changes require domain/control verification and privileged step-up.

**Policy:** membership plus approved authentication context for that tenant; claimed groups use allowlisted mapping, never arbitrary owner creation. **State:** provider config/metadata/certificates, external identities, verified domains, session auth context, memberships/audit. **Session:** local cookie with expiry policy; OP session is independent. Strong actions require fresh assurance, not “SSO once”.

**Standards:** OIDC code+PKCE for modern RP/mobile; SAML Web Browser SSO for supported enterprise ecosystem. **Failure:** no trusted provider/key means no new login; existing-session policy is separate; break-glass has explicit guardrails. **Audit:** metadata/cert and enforcement changes, federated events and rejected issuer/context. **Trade-off:** centralized authentication reduces credential sprawl while concentrating issuer risk. **Tests:** stage 11/18 and full OIDC browser flow; add SSO-required tenant access through a local-password session and require rejection. SAML HTTPS browser integration is a separate deployment exercise.

## D. Enterprise provisioning/offboarding

**Requirements:** create users/groups, reconcile attributes, preserve other tenants’ access, remove former employees within a stated bound. **Threats:** over-provisioning, connector compromise, duplicate retry, lost deactivation and stale sessions.

**Identity:** tenant-bound connector; server SCIM IDs; upstream external IDs; local user and independent tenant memberships. **Flow:** directory create → SCIM resource → allowed membership mapping → periodic reconciliation; deactivate → transaction changes membership and revocation version → invalidate relevant sessions/refresh → emit durable event → reconcile downstream acknowledgments.

**Policy:** provisioning changes authority inputs; it does not bypass runtime authorization. Trusted group IDs map to permitted roles; privileged assignments require separate review. **State:** SCIM resources/version, connector mapping, group edges, sync cursor, retry queue/outbox, memberships and audit. **Token/session:** remove effective membership immediately in local state; distributed caches follow a documented bounded SLA; global account suspension and tenant-only offboarding are distinct operations.

**Standards:** SCIM Users/Groups/filter/PATCH/pagination/ETag; declare unsupported extensions/Bulk. **Failure:** retry transient errors, quarantine invalid mappings, detect divergence and oldest unprocessed lifecycle event; never mark deprovisioned just because a request was queued. **Audit:** source event, mapping changes, attempts/results, account state and final resource denial. **Trade-off:** eventual delivery versus stringent SLA requiring current local checks. **Tests:** stage 19/22; add drop/retry/duplicate events, out-of-order active transitions, failed invalid PATCH and cross-tenant connector attempts. Stage 19 tests atomic PATCH and version conflicts.

## E. Microservice communication

**Requirements:** services authenticate each other, target-specific least privilege, user delegation where needed, no shared long-lived universal secret. **Threats:** spoofed headers, credential theft, replay, lateral movement and confused deputy.

**Identity:** stable service principal plus ephemeral workload instance; user subject and acting service recorded separately. **Flow:** attest environment → issuer grants narrow short-lived credential → authenticate destination via TLS → present audience-bound service token/cert → verify caller/delegation → evaluate target policy → scoped database operation. Service discovery locates destinations; it does not independently establish their identity.

**Policy:** caller service may invoke specific APIs; delegated user must independently retain object/tenant rights. Privileged service authority cannot be activated by an arbitrary user header. **State:** workload issuer/trust bundle, service policy, replay store where required, delegation grants, audit and rotation metadata. **Token:** short workload certificate or access token; exchange rather than blindly forward a browser session. Audience narrowing prevents a docs credential becoming billing authority.

**Standards:** mTLS, OAuth client credentials/private-key client assertions, token exchange, DPoP or HTTP Message Signatures where justified. **Failure:** unknown workload/audience fails closed; issuer outage has bounded existing-credential grace only if specified. **Audit:** workload issuance, actor/subject, target action, replay/identity mismatches. **Trade-off:** issuer/attestation infrastructure versus secret distribution; network authentication does not eliminate object policy. **Tests:** stages 12/20; add wrong service audience, header spoofing, altered body, replay, expired workload identity and user revoked during queued job.

## F. Multi-tenant collaboration

**Requirements:** users join multiple workspaces, organization roles vary, documents inherit folder sharing, guests have bounded access. **Threats:** tenant leakage, stale relationship edges, accidental role inheritance and resource moves crossing boundaries.

**Identity:** users, organization memberships, workspace memberships, documents/folders and sharing tuples. **Flow:** authenticate → select active organization → locate resource under stored tenant → evaluate RBAC baseline plus explicit sharing/ABAC predicates → execute same scoped operation → audit. A route organization switch updates context only after membership verification.

**Policy:** combine RBAC organizational duties with ReBAC reader/editor edges and ABAC classification/step-up; define deny precedence. Limit graph depth/cycles. A move operation checks source access, destination access and invariant-preserving tenant relationships in one transaction. **State:** tenant-composite documents/folders; tuple/version state; invitations, role assignments and audit. **Session/token:** one account session can select multiple orgs; a delegated AT should be bound to its grant/tenant and must not switch tenants from a query parameter.

**Standards:** ordinary app authorization with OIDC/SCIM when enterprise needs appear; OAuth is unnecessary for internal sharing semantics. **Failure:** missing facts or invalid graph defaults deny; cache revisions must be observable. **Audit:** sharing changes, moves, guest expiry and administrative actions. **Trade-off:** graph flexibility versus policy explainability and cache consistency. **Tests:** stages 16/17; add reader revoked through parent, cycle, deleted member, shared resource moved to B, stale folder-policy cache and search/export equivalence.

## G. High-security administration

**Requirements:** protect keys/SSO/owner transfers, fresh strong authentication, approvals, auditable emergency access. **Threats:** MFA bypass, stolen ordinary session, self-approval, owner escalation and privileged insider misuse.

**Identity:** ordinary administrator, independent approver, short-lived elevation and separately protected break-glass principal. **Flow:** request specific operation/target → fresh step-up → independent approval → issue narrow expiring elevation bound to action hash → revalidate current roles/approval/assurance → consume once → execute transaction → immutable audit checkpoint. Approval is for exact arguments, not an arbitrary later request.

**Policy:** separation of duties; requester cannot approve self; administrators cannot create owners through generic membership editing; emergency access has limited tasks and time. **State:** privileged requests, argument digest, approvers, credential/auth context, one-use elevation record, ownership state and audit sink. **Session:** normal session persists but privilege is an explicit fresh bounded context, never a permanent `isAdmin` cookie.

**Standards:** WebAuthn/assurance contracts and application approval policy; no standard token alone supplies the approval workflow. **Failure:** approval/audit unavailability denies non-emergency changes; break-glass use alerts and requires review, including during IdP outage. **Audit:** request/approval/elevation/execution/expiry with exact resource/action references. **Trade-off:** administrative friction versus blast-radius reduction; emergency availability can weaken trust if unmanaged. **Tests:** stage 15/16/17 models; design unimplemented tests for self-approval, stale auth, changed arguments, concurrent consume and final-owner races before extending the project.

## H. Identity-provider outage

**Requirements:** explicit continuity for existing users; no indefinite acceptance of unknown/expired credentials; identify where issuer calls are needed. **Threats:** fail-open login, stale keys/permissions, outage used to bypass MFA and false global-logout assumptions.

**Identity:** existing local principal/session; known issuer/key cache; service identities and break-glass separately scoped. **Flow/policy:** existing sessions may continue only while local account/membership/session checks succeed and assurance policy permits; new federated logins fail; JWT ATs validate with still-trusted cached keys until normal expiry; unknown kid fails; opaque introspection fails unless a documented bounded cache is permitted; refresh requiring IdP fails; privileged actions needing fresh IdP MFA fail. Never fall back from required enterprise SSO to weak local login invisibly.

**State:** session store, bounded discovery/JWKS/introspection caches, local memberships, provider health, deprovision retry state, emergency controls. **Token:** expiry is never extended merely because issuer is unavailable. **Standards:** normal validation/lifecycle protocols continue; availability behavior is an explicit application recommendation. **Failure:** surface unavailable versus invalid without exposing secret context; backoff prevents a refresh/discovery storm; restore and reconcile lifecycle backlog before claiming normal SLA.

**Audit:** outage, cache grace decisions, denied new/privileged login, lifecycle backlog and break-glass. **Trade-off:** continuing known sessions improves availability but can retain upstream-revoked access while events are unavailable; high-risk tenants may require stricter online freshness. **Tests:** stop local OP after a successful login and test session continuity; attempt new login/refresh/unknown kid; expire cached token; locally revoke membership; assert outage never bypasses MFA or tenant policy. These outage scenario tests are proposed exercises, not included in the current 23 Node tests.
