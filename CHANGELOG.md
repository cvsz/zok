# Changelog

All notable release-control and implementation changes to Zok are documented here.

The format follows Keep a Changelog principles and uses calendar dates while the project remains pre-Gold-Master.

## [Unreleased]

### Added
- `IMPLEMENTATION-CHECKLIST.md` as the evidence-based operational release checklist.
- Tested JSON storage boundary and Express architecture regression coverage.
- Initial normalized PostgreSQL schema + rollback migrations for tenants, users/roles, contacts/conversations/messages, campaigns, integrations, consent, sessions, and audit events.
- PostgreSQL 17 service-backed migration up/down/replay verification.
- Forced tenant RLS using fail-closed `app.tenant_id` policies and non-superuser/NOBYPASSRLS negative tests.
- Tenant-scoped composite foreign keys and concurrent uniqueness/integrity verification.
- `server/storage/postgres-storage.js` with real `pg.Pool`, explicit transaction boundaries, transaction-local tenant context, rollback, guaranteed client release, and authenticated identity binding.
- npm-generated synchronized `pg ^8.23.0` manifest/lockfile and real PostgreSQL 17 pool/RLS integration coverage.
- Validated `ZOK_ADMIN_TENANT_ID` propagation into the bounded configured-admin principal.
- `server/storage/request-transaction.js` as a fail-closed request-principal → PostgreSQL transaction boundary.
- `server/storage/postgres/contacts-repository.js` for tenant-scoped normalized contact reads/creates with validation.
- `server/storage/postgres/conversations-repository.js` for tenant-scoped conversation creation, message insertion, conversation listing, stable external-thread lookup, and ordered message reads with validated channel/direction/sender semantics.
- Real PostgreSQL relational repository integration proving contact → conversation → message writes, tenant isolation, and cross-tenant relationship rejection.
- Pure legacy-chat compatibility mapper with deterministic `legacy-chat:<id>` contact/thread IDs and indexed message IDs, explicit sender/direction mapping, metadata preservation, and fail-closed validation.
- `server/storage/postgres/legacy-chat-runtime.js` as a bounded authenticated request → tenant transaction → normalized conversations repository read/write boundary for already-imported legacy chat threads; live Express routes are not switched by this slice.

### Changed
- `server.js` delegates filesystem persistence to `createJsonStorage` rather than owning JSON write internals.
- PostgreSQL transaction callbacks now expose the already-validated `tenantId` to repository code so repositories do not accept caller-supplied tenant overrides.
- Durable-data execution now requires incremental normalized repository and route cutover rather than a monolithic JSON-in-PostgreSQL compatibility shortcut.
- Legacy display-only message times are preserved as metadata rather than being invented as database timestamps during compatibility mapping.
- Legacy mapper determinism regression coverage now clones the JSON-compatible fixture with JSON round-trip semantics so the existing ESLint environment remains green without widening globals.
- The bounded legacy runtime maps existing API sender semantics `customer` → inbound/customer, `agent` → outbound/agent, `bot` → outbound/ai, and `system` → outbound/system while rejecting invalid tenant identity, IDs, empty/oversized text, and unsupported senders before persistence.

### Verification evidence
- JSON adapter red `32329601944`; subsequent adapter green.
- PostgreSQL schema red/green `32330472344` / `32330521144`.
- Migration runtime red/green `32330868918` / `32330980037`.
- Tenant RLS red/green `32331153421` / `32331262316`.
- Tenant relational integrity red/green `32331342959` / `32331409295`.
- Concurrent integrity green `32331479289`.
- Express storage-boundary red/green `32333253897` / `32333372481`.
- PostgreSQL identity transaction red/green `32337912124` / `32337964164`.
- Real PostgreSQL pool red `32344793562`; `32344862826` exposed a test-isolation race; isolated real pool/RLS green `32344957870`.
- Express tenant principal red/green `32345044007` / `32345360432`.
- Request-to-transaction helper red/green `32345449008` / `32345518040`.
- Contacts repository red `32345736541`; `32345808587` identified a test-harness whitespace bug; real transaction tenant-context red/green `32345984084` / `32346064982`.
- Conversations/messages repository red/green `32346149065` / `32346242401`.
- Real normalized relational repository integration green `32346343315`.
- Legacy compatibility mapping contract added test-first in commit `26906f28c34d74077c3e496d0ddbf1ab21a080fb`; implementation commit `777af487395161b74fc1be472d1f5ddd448c73fb`.
- Synchronized mapper head CI `32346860728` exposed one ESLint `no-undef` regression for `structuredClone` after all 24 tests passed. Fix commit `42c1c4995de3f3a22d743f53dd6a630747a32884` replaced it with a JSON-compatible clone; CI `32351874076` then passed release-document checks, PostgreSQL service health, `npm ci`, all 24 tests, lint, typecheck, build, and production dependency audit.
- Bounded post-merge runtime commits: conversation lookup/read primitives `d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af`, request-bound runtime `e95d2751804bed7c7a3b9ff055b5108829de8a54`, and regression coverage `81abadeb91261ebeb232ca71d3fed88069f40223`. CI `32357209712` passed release-control document checks, PostgreSQL service/client verification, `npm ci`, all tests, lint, typecheck, production build, and production dependency audit.

### Post-merge execution
- PR #6 was the only open implementation PR and was squash-merged to `main` as `edbc8ba85a534e49fe3881b24c8a55560671421f` after green CI `32352025017`.
- The merged foundation remains intentionally not Gold Master; bounded Express route cutover, import/rollback, backup/restore, production RBAC, and Gate D evidence remain incomplete.
- Draft PR #15 on `feat/postgres-chat-runtime-boundary` contains the verified request-bound PostgreSQL read/write runtime needed before touching live chat routes; JSON remains the canonical live store and explicit rollback path.

### Release status
- FOUNDATION HARDENED / NOT GOLD MASTER.
- Live Express data routes remain JSON-backed. The request-bound PostgreSQL legacy runtime is CI-green but is not a route cutover, import, rollback, backup/restore, production multi-user tenant identity/RBAC, shared session/rate-limit state, or Gate D completion claim.

## [2026-08-10]

### Security and runtime hardening
- Removed hardcoded demo credentials from the canonical login path.
- Added authenticated session handling, CSRF/origin checks, rate limiting, validation, safe error handling, and security headers.
- Added health verification and serialized atomic JSON persistence behavior.
- Established Vite + React frontend with Express adapter as the canonical runtime.
- Added test, lint, typecheck, build, and production dependency audit release gates.

### Known release blockers
- Durable PostgreSQL application-runtime cutover remains incomplete.
- Enterprise identity/RBAC/audit governance remains incomplete.
- Shared production session/rate-limit state remains incomplete.
- Real channel/POS adapters and durable queue workers remain incomplete.
- AI policy/evaluation service remains incomplete.
- Independent security, load, disaster-recovery, privacy, and production-edge evidence remain incomplete.
