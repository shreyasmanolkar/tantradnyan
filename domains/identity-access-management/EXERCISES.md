# Predict, break, repair: IAM exercise workbook

Read [the guide](GUIDE.md) progressively. The commands below run local generated accounts/keys only. All exercises have a prediction and invariant; record your own result separately from the checked [experiment evidence](experiments/README.md). A “design” exercise has no implied completed implementation.

Common setup:

```sh
cd domains/identity-access-management/iam-first-principles
npm ci
npm test
npm run demo
# Run one stage without hiding its source:
node --test 10-pkce/tests/*.test.mjs
node 10-pkce/experiments/run.mjs
```

The root test script includes real local sockets; OpenSSL is needed for generated SAML certificates. Node 22.14+ LTS or a compatible later LTS is recommended. Actual validation on this workstation used Node 26.7.0 and the provider warned that this is not its recommended LTS runtime. Inspect the lockfile before repeating library-specific exercises.

| # | Driver / manipulation | Predict before running | Security principle / production lesson |
| --- | --- | --- | --- |
| 1 | stage 01: change signed tenant/action bytes | original signature valid; changed bytes invalid | authentic bytes still need key trust and resource policy |
| 2 | stage 02: hash same password twice; verify wrong one | salts/records differ; wrong secret false | password KDF slows offline attack; salt is public |
| 3 | stage 03: retain pre-login ID, rotate, replay old | old ID resolves null | post-login authority must not attach to attacker-chosen ID |
| 4 | stage 03: use active session at idle/absolute boundary | expiry rejects exactly at configured bound | cookie lifetime does not substitute for server expiry |
| 5 | stage 04: correct proof but foreign Origin; correct Origin/wrong proof | both rejected | require intended browser action, not merely cookie possession |
| 6 | stage 05: authenticate viewer then request member management | deny although principal is active | login is not a blanket authorization decision |
| 7 | stage 06: use key for billing audience or after revoke | null validation | integration credential identity, audience and policy differ |
| 8 | stage 07: decode token; change sub without resigning | decode displays attacker claim; verify fails | decoding is parsing, never trust |
| 9 | stage 07: wrong issuer/audience/algorithm/time | all reject | signature alone cannot select valid context |
| 10 | stage 07: submit client-addressed ID token to access-token validator | reject profile/audience | identity event is not an API credential |
| 11 | stage 08: publish old+new, then new only | overlap accepts old; retirement rejects | separate normal rollover from emergency distrust |
| 12 | stage 08: remote JWKS known versus unknown kid | known validates; unknown rejects | keys come from configured issuer source, never token URL |
| 13 | stage 09: unregistered callback, increased scope, reused code | reject each | exact recipient, approved authority and one-use transitions |
| 14 | stage 10: attacker redeems code with another verifier | intercepted attempt fails; original succeeds once | PKCE binds transaction secret, not app brand |
| 15 | stage 11: wrong state/fabricated callback against actual local OP | callback validation fails | RP transaction must match browser/issuer context |
| 16 | start `npm run oidc`, `npm run serve`, sign in as alice | real OP code/PKCE/OIDC login yields Alice local session | use maintained RP validation; do not merge by email |
| 17 | stage 12: client secret with unregistered audience/scope | authentication/scope rejection | a client principal is not an end-user |
| 18 | stage 13: introspect, revoke, introspect again | active then inactive | central state enables direct credential revocation |
| 19 | stage 14: reuse parent RT, try newest child | reuse revokes family, child fails | durable lineage/client binding and atomic rotation |
| 20 | stage 14: revoke refresh then verify old JWT locally | JWT signature/context still valid | renewal removal does not automatically withdraw issued ATs |
| 21 | stage 15: cyclic roles and self-owner assignment | reject | role hierarchy and assignment authority need separate invariants |
| 22 | stage 16: stale MFA age, wrong department/tenant, ReBAC cycle | deny/bounded termination | trusted attributes and relationships require freshness/termination |
| 23 | stage 17: Alice A credential, B document ID, revoked membership | deny despite active authentication | tenant/resource/current membership must all bind |
| 24 | stage 17 real PostgreSQL: B document uses A workspace | composite FK rejection | encode containment relationships, not just IDs |
| 25 | stage 18: signed synthetic SAML response, replay, tamper, wrong recipient | only original bound signed assertion succeeds | signed consumed XML and correlation both matter |
| 26 | stage 19: provision User+Group, filter, PATCH deactivation | membership resource active becomes false; callback fires | lifecycle is separate from SSO; revocation hook must be real |
| 27 | stage 19: stale ETag or invalid second PATCH operation | 412 or error; no partial first-operation mutation | concurrency and atomic PATCH preserve state |
| 28 | stage 20: signed request replay/body mutation/stale timestamp | first valid only | signature coverage and freshness state are distinct |
| 29 | stage 21: append with password/token input, edit event | secrets omitted; integrity verification fails after edit | minimize logs; chaining has separate truncation/key-holder limits |
| 30 | stage 22: HTTP login, code/refresh, rotate, SCIM, logout | successful bounded flow; failure cases deny | independent mechanisms must compose without skipping policy |
| 31 | browser: A read, B read, revoke and re-read | 200, unavailable, then 401 | browser continuity/revocation requires actual browser review |
| 32 | design: stop OP after login | existing local session policy differs from new login | explicit outage policy; no bypass of tenant/assurance |
| 33 | design: SCIM deactivation lost for ten minutes | upstream truth alone cannot meet short SLA | durable retry/reconciliation and current state monitoring |
| 34 | design: folder reader removed during export job | job cannot blindly trust enqueue-time role forever | authorize delegated asynchronous work at execution boundary |
| 35 | design: passkey registration with wrong origin/challenge | server rejects ceremony | RP-bound key proofs require full ceremony validation |
| 36 | design: privileges changed after two-person approval | operation rechecks authority and argument binding | approvals are scoped state, not permanent admin flags |

## Observation template

Question → hypothesis → initial state/trust assumptions → exact command/input → expected outcome → **actual outcome or not run** → explanation → limits → next counterexample. Never copy a predicted result into an observed-results field.

For an HTTP experiment, record statuses and sanitized action/resource/tenant state. Do not persist credential values, SAML assertion bodies or full browser network captures containing secrets. Logical mechanism clocks and real browser/provider clocks are different evidence scopes.

## Follow a mechanism into maintained code

From stage 07, find where `jose` applies algorithm and audience checks in the locked package. From stage 11, find RP nonce/state and signature validation, then the OP’s code-grant binding. From stage 18, follow selection of the signature-validated assertion and compare the explicit recipient/destination checks. Record the lockfile version or upstream commit next to your notes; avoid claims about a moving main branch.
