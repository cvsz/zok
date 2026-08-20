# Changelog

All notable release-control and implementation changes to Zok are documented here.

The format follows Keep a Changelog principles and uses calendar dates while the project remains pre-Gold-Master.

## [Unreleased]

### Added
- `IMPLEMENTATION-CHECKLIST.md` as the evidence-based operational release checklist.
- `server/storage/json-storage.js` and `test/storage.test.js` as the tested local storage-boundary foundation.
- Initial PostgreSQL schema and rollback migrations in `server/storage/postgres/migrations/001_initial.*.sql` for tenants, roles/users, contacts/conversations/messages, campaigns, integrations, consent, sessions, and audit events.
- `test/postgres-schema.test.js` as the structural schema contract.
- PostgreSQL 17 service-backed CI migration execution via `scripts/postgres-migrations.js` and `test/postgres-migration-runtime.test.js`.
- `002_tenant_rls.*.sql` enabling and forcing row-level security on tenant-owned tables with fail-closed `app.tenant_id` policies.
- Non-superuser/NOBYPASSRLS negative tests proving cross-tenant reads are filtered, cross-tenant writes are rejected, and missing tenant context exposes no tenant rows.
- `003_tenant_relational_integrity.*.sql` adding tenant-scoped composite foreign keys so globally valid IDs cannot link objects across tenants.
- PostgreSQL concurrent-write integrity verification proving tenant-scoped uniqueness remains correct under competing writes.

### Changed
- Refreshed `exec-planing.md` into the canonical master execution ledger with P0-P3 priorities and evidence gates.
- `.github/workflows/ci.yml` provisions a health-checked PostgreSQL 17 service while retaining least-privilege permissions, concurrency cancellation, document checks, tests, lint, typecheck, build, and production dependency audit.
- PostgreSQL migrations now execute and roll back against a real database in CI; this does not yet mean the live Express runtime uses PostgreSQL.
- Durable-data security now has both RLS isolation and tenant-scoped relational-integrity enforcement at the database layer.

### Verification evidence
- JSON adapter TDD red: CI `32329601944`; subsequent adapter verification green.
- PostgreSQL schema TDD red: CI `32330472344`; schema green: CI `32330521144`.
- Runtime migration TDD red: CI `32330868918`; migration up/down/replay green: CI `32330980037`.
- Tenant RLS TDD red: CI `32331153421`; non-superuser tenant-isolation green: CI `32331262316`.
- Tenant relational-integrity TDD red: CI `32331342959`; composite-FK enforcement green: CI `32331409295`.
- Concurrent PostgreSQL integrity: CI `32331479289` passed with exactly one successful write among 12 competing inserts for the same tenant/email key, followed by all lint/typecheck/build/audit gates.

### Release status
- FOUNDATION HARDENED / NOT GOLD MASTER.
- Parent P0 durable PostgreSQL cutover remains incomplete: `server.js` still owns the live JSON request path and no production PostgreSQL application adapter, connection pool, transaction boundary, production cutover, or verified backup/restore drill exists yet.

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
