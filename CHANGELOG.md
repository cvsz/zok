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
- `server/storage/postgres/conversations-repository.js` for tenant-scoped conversation creation, message insertion, and conversation listing with validated channel/direction/sender semantics.
- Real PostgreSQL relational repository integration proving contact → conversation → message writes, tenant isolation, and cross-tenant relationship rejection.
- Pure legacy-chat compatibility mapper with deterministic `legacy-chat:<id>` contact/thread IDs and indexed message IDs, explicit sender/direction mapping, metadata preservation, and fail-closed validation.

### Changed
- `server.js` delegates filesystem persistence to `createJsonStorage` rather than owning JSON write internals.
- PostgreSQL transaction callbacks now expose the already-validated `tenantId` to repository code so repositories do not accept caller-supplied tenant overrides.
- Durable-data execution now requires incremental normalized repository and route cutover rather than a monolithic JSON-in-PostgreSQL compatibility shortcut.
- Legacy display-only message times are preserved as metadata rather than being invented as database timestamps during compatibility mapping.

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
- Legacy compatibility mapping contract added test-first in commit `26906f28c34d74077c3e496d0ddbf1ab21a080fb`; implementation commit `777af487395161b74fc1be472d1f5ddd448c73fb`. Final CI evidence is recorded only after the synchronized head completes.

### Release status
- FOUNDATION HARDENED / NOT GOLD MASTER.
- Live Express data routes remain JSON-backed. Legacy chat mapping is now explicit and contract-tested in source, but route cutover, JSON→PostgreSQL migration/rollback, backup/restore, production multi-user tenant identity/RBAC, shared session/rate-limit state, and remaining Gate D evidence remain incomplete.

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
