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
- `server/storage/postgres-storage.js` with explicit transaction boundaries, transaction-local tenant context, rollback, guaranteed client release, `withIdentityTransaction`, and real `pg.Pool` factory.
- npm-generated synchronized `pg ^8.23.0` manifest/lockfile and real PostgreSQL 17 pool/RLS integration test.
- Validated `ZOK_ADMIN_TENANT_ID` propagation into the bounded configured-admin authenticated principal.
- `server/storage/request-transaction.js` as a fail-closed request-principal → `withIdentityTransaction` boundary.

### Changed
- `server.js` delegates filesystem persistence to `createJsonStorage` rather than owning JSON write internals.
- PostgreSQL foundation now has a production Node driver, synchronized lockfile, real pooled transactions, database RLS enforcement, and request tenant binding primitives.
- Durable-data execution order now requires explicit normalized relational repositories and incremental route cutover rather than a monolithic JSON-in-PostgreSQL compatibility shortcut.

### Verification evidence
- JSON adapter red `32329601944`; subsequent adapter green.
- PostgreSQL schema red/green `32330472344` / `32330521144`.
- Migration runtime red/green `32330868918` / `32330980037`.
- Tenant RLS red/green `32331153421` / `32331262316`.
- Tenant relational integrity red/green `32331342959` / `32331409295`.
- Concurrent integrity green `32331479289`.
- Express storage-boundary red/green `32333253897` / `32333372481`.
- PostgreSQL identity transaction red/green `32337912124` / `32337964164`.
- Real PostgreSQL pool red `32344793562`; `32344862826` exposed and preserved a test-isolation failure; isolated real pool/RLS green `32344957870`.
- Express tenant principal red `32345044007`; green `32345360432`.
- Request-to-transaction helper red `32345449008`; green `32345518040`.

### Release status
- FOUNDATION HARDENED / NOT GOLD MASTER.
- Live Express data routes remain JSON-backed; normalized PostgreSQL repositories, incremental route cutover, JSON→PostgreSQL migration/rollback, backup/restore, production multi-user tenant identity/RBAC, shared session/rate-limit state, and remaining Gate D evidence are incomplete.

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
