# IAM state, PostgreSQL constraints and transactional authority

Continue from [guide chapters 22 and 26](GUIDE.md#26-postgresql-data-modeling-and-concurrency). Runnable schema: [stage 17 SQL](iam-first-principles/17-multi-tenant-iam/src/schema.sql). Runnable query/role operation: [postgres.mjs](iam-first-principles/17-multi-tenant-iam/src/postgres.mjs). The schema is a teaching design; not all tables have an application handler. The integration uses ephemeral maps, so this exercise verifies real relational constraints without pretending the app has durable persistence.

## Relational responsibilities

| Relation | Immutable key / important constraint | Why state exists |
| --- | --- | --- |
| users | UUID; case-folded local email uniqueness for this model | local account status distinct from external identity |
| organizations | UUID | tenant policy boundary |
| workspaces | UUID plus `(organization,id)` uniqueness | tenant-contained collaboration space |
| identity_providers | UUID; organization+issuer unique | approved protocol/metadata/key trust configuration |
| external_identities | `(provider,subject)` PK | prevent email-based linking and duplicate subject binding |
| memberships | `(organization,user)` PK, allowed role set | current organization authority independent of login |
| documents | `(organization,id)` PK; workspace/owner composite FKs | cross-tenant relationship cannot be stored accidentally |
| roles/permissions | tenant role ID; global permission name | named policy inputs |
| role_permissions/assignments | composite tenant foreign keys | permissions cannot be assigned through another tenant’s role |
| sessions | secret digest PK; user, security version, timestamps | revocable browser context and authentication age |
| oauth_clients | client ID, registered callbacks/scopes; public client has no shared secret | client registry and secret boundary |
| authorization_grants/codes | grant UUID; random code digest, redirect/challenge/expiry/use | record delegation and one-time redemption bindings |
| refresh_families/tokens | family UUID; secret digest; absolute expiry/use/revoke | rotation and replay detection with durable lineage |
| api_credentials | UUID; secret digest, audience/scopes/expiry | independent integration lifecycle |
| signing_keys | kid; public JWK and KMS reference | publish/retire verification trust without storing private key |
| invitations | UUID, unique random-secret digest, allowed role/expiry/use | bounded membership enrollment |
| mfa_credentials | credential UUID and WebAuthn credential ID unique | public verifier material or protected TOTP seed |
| audit_events | append-oriented event ID/time, org index | accountable security transitions |
| scim_resources/group_members | `(organization,id)` keys and composite edges | connector-scoped lifecycle representation |
| provisioning_state | `(organization,connector)` key, cursor/retry status | reconcile deliveries and identify backlog |
| verified_domains | domain PK under policy | provider routing/control evidence, never entitlement |

Model-specific simplifications: email uniqueness is local account policy, not a universal IAM rule; one built-in membership role coexists with demonstration custom-role tables, but the query uses only the built-in role. SCIM externalId is indexed but not globally unique because it belongs to provisioning-client semantics. Production schema may include connector IDs in that uniqueness domain. Provider+subject mapping may deliberately allow one provider configuration to serve multiple organizations; then membership and federation policy must enforce each separately.

## Authorization and tenant binding

The runnable document query joins documents→memberships→users with a stored organization predicate. It returns nothing for wrong tenant, inactive membership or suspended user. The same join is useful for bulk list/search/export so those endpoints do not leak objects through an easier path. The composite workspace FK rejects creating a B document in an A workspace even before application checks.

No query alone implements all possible policy. If a workspace/folder-sharing model is added, its relationships must join/evaluate in the same decision; fetching one row by tenant is necessary but not sufficient. Use transactions to keep resource identity and policy checks aligned with the mutation. A read can legitimately linearize before a concurrent revocation; define the revocation acceptance point and cache policy rather than claiming instant global effects.

The role assignment operation locks current actor membership and account rows and allows only an active owner to assign viewer/editor/admin to a distinct active member. Revocation/suspension updating those same rows must serialize. Ownership transfer/last-owner constraints and custom-role evaluation are deliberate omissions, not implied guarantees.

## Atomic code and refresh transitions

Production authorization code consumption needs an atomic conditional transition:

```sql
UPDATE authorization_codes
SET used_at=now()
WHERE secret_hash=$1 AND used_at IS NULL AND expires_at>now()
  AND redirect_uri=$2 AND pkce_challenge=$3
RETURNING grant_id;
```

Client/grant identity and verifier-derived challenge must be validated under the same transaction; the example is one transition, not a complete OAuth endpoint. A zero-row result is invalid_grant. Avoid deleting used rows too early if replay evidence is required.

For refresh rotation: BEGIN → lock family row → inspect presented token under that family → validate client/grant/absolute expiry → if previously used, mark family revoked → otherwise mark token used and insert a random child digest → commit. Crucially, a reuse-triggered revocation must **commit** before returning an error; rolling back the transaction because an exception was thrown would undo the security response. Concurrent refreshes can make one legitimate request appear as replay; the client must serialize refresh or use a explicitly designed grace policy.

For deactivation: update membership/current security version → revoke relevant sessions and refresh grants → write audit/outbox row → commit. Asynchronously publish outbox; retry and reconcile delivery. Account-wide suspension differs from one-tenant offboarding. The integration conservatively revokes all browser sessions/refresh families for the mapped account when a tenant SCIM deactivation occurs; it preserves the account and other membership rows, and documents this coarse revocation choice.

## Secrets and retention

Never persist plaintext passwords, raw session/API/code/refresh bearer secrets, private signing keys or raw tokens in audit events. Store password KDF records and random-secret digests; use keyed hashing where a distinct secret-store trust boundary calls for it. Client secrets held for outbound use, TOTP seeds and third-party refresh tokens cannot simply be hashed because the app needs to retrieve/use them: encrypt under separately controlled keys and restrict access. Passkey public keys are not secret, but credential metadata can be personal data.

Use immutable internal IDs in audit history. Account deletion may pseudonymize actor references instead of cascading away all accountability; define justified retention and privacy erasure boundaries. Physical deletion, SCIM deactivation and membership suspension have distinct effects. The schema intentionally does not prescribe one retention period or compliance regime.

## Database exercise

Use a separate local PostgreSQL database; never apply the schema to an existing app database. `npm run test:postgres` creates a uniquely named test schema, applies SQL, seeds A/B, exercises isolation/revocation/suspension/role checks and drops **only that test schema** in finally. It fails when no explicit database URL is supplied; a skipped test cannot masquerade as success.

```sh
cd domains/identity-access-management/iam-first-principles
IAM_DATABASE_URL='postgres://iam_lab:example-only@127.0.0.1:5432/iam_lab' npm run test:postgres
```

Predict which composite FK rejects a B document referencing an A workspace. Run; inspect the actual constraint failure; then add tenant-specific custom roles and test that assignment of an A role in B fails. The test connection needs CREATE SCHEMA in the **dedicated learning database**. Running it as a database superuser would not establish RLS correctness; the existing test does not implement or claim RLS.
