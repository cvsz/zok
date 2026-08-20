# Changelog

All notable release-control and implementation changes to Zok are documented here.

The format follows Keep a Changelog principles and uses calendar dates while the project remains pre-Gold-Master.

## [Unreleased]

### Added
- `IMPLEMENTATION-CHECKLIST.md` as the evidence-based operational release checklist.
- `server/storage/json-storage.js` and `test/storage.test.js` as the tested local storage-boundary foundation.
- `test/storage-boundary-wiring.test.js` as the architecture regression contract proving the Express runtime delegates persistence through the storage adapter.
- Initial PostgreSQL schema and rollback migrations in `server/storage/postgres/migrations/001_initial.*.sql` for tenants, roles/users, contacts/conversations/messages, campaigns, integrations, consent, sessions, and audit events.
- `test/postgres-schema.test.js` as the structural schema contract.
- PostgreSQL 17 service-backed CI migration execution via `scripts/postgres-migrations.js` and `test/postgres-migration-runtime.test.js`.
- `002_tenant_rls.*.sql` enabling and forcing row-level security on tenant-owned tables with fail-closed `app.tenant_id` policies.
- Non-superuser/NOBYPASSRLS negative tests proving cross-tenant reads are filtered, cross-tenant writes are rejected, and missing tenant context exposes no tenant rows.
- `003_tenant_relational_integrity.*.sql` adding tenant-scoped composite foreign keys so globally valid IDs cannot link objects across tenants.
- PostgreSQL concurrent-write integrity verification proving tenant-scoped uniqueness remains correct under competing writes.
- `server/storage/postgres-storage.js` as a pool-injected PostgreSQL transaction boundary that validates tenant UUIDs, binds `app.tenant_id` transaction-locally with parameterized `set_config`, commits or rolls back, and always releases the pooled client.
- `withIdentityTransaction(identity, operation)` to bind a validated authenticated identity object to the tenant transaction boundary without trusting an arbitrary tenant override from the operation.
- `test/postgres-storage.test.js` coverage for transaction ordering, fail-closed missing tenant context, authenticated identity binding, rollback, client release, and pool shutdown.

### Changed
- Refreshed `exec-planing.md` into the canonical master execution ledger with P0-P3 priorities and evidence gates.
- `.github/workflows/ci.yml` provisions a health-checked PostgreSQL 17 service while retaining least-privilege permissions, concurrency cancellation, document checks, tests, lint, typecheck, build, and production dependency audit.
- PostgreSQL migrations now execute and roll back against a real database in CI; this does not yet mean the live Express runtime uses PostgreSQL.
- Durable-data security now has both RLS isolation and tenant-scoped relational-integrity enforcement at the database layer.
- `server.js` no longer owns filesystem persistence internals; its `readDB()`/`updateDB()` path delegates to the tested `createJsonStorage` adapter. The live adapter remains JSON-backed pending PostgreSQL application-adapter work.
- The PostgreSQL adapter contract now has an explicit identity-to-tenant transaction entry point, but Express sessions are not yet tenant-aware and no production Node PostgreSQL pool driver is installed or wired.

### Verification evidence
- JSON adapter TDD red: CI `32329601944`; subsequent adapter verification green.
- PostgreSQL schema TDD red: CI `32330472344`; schema green: CI `32330521144`.
- Runtime migration TDD red: CI `32330868918`; migration up/down/replay green: CI `32330980037`.
- Tenant RLS TDD red: CI `32331153421`; non-superuser tenant-isolation green: CI `32331262316`.
- Tenant relational-integrity TDD red: CI `32331342959`; composite-FK enforcement green: CI `32331409295`.
- Concurrent PostgreSQL integrity: CI `32331479289` passed with exactly one successful write among 12 competing inserts for the same tenant/email key, followed by all lint/typecheck/build/audit gates.
- Express storage-boundary TDD red: CI `32333253897`; green: CI `32333372481` passed the new architecture test, existing API regression tests, PostgreSQL tests, lint, typecheck, build, and production dependency audit.
- PostgreSQL adapter identity-binding TDD red: CI `32337912124` failed because `withIdentityTransaction` did not yet exist.
- PostgreSQL adapter identity-binding green: CI `32337964164` passed `npm ci`, all tests, lint, typecheck, production build, and production dependency audit.
- An earlier server-session tenant-identity probe intentionally failed in CI `32337797235`; that exploratory test was reverted because the current connector could not safely patch the large `server.js` file without whole-file replacement. No incomplete server capability is claimed from that probe.

### Release status
- FOUNDATION HARDENED / NOT GOLD MASTER.
- Parent P0 durable PostgreSQL cutover remains incomplete: the live Express boundary is still JSON-backed; no production PostgreSQL driver/pool is wired; Express-authenticated identities do not yet carry tenant IDs; no end-to-end request-to-transaction tenant binding, production cutover/rollback, or verified backup/restore drill exists yet.

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
