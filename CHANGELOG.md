# Changelog

All notable release-control and implementation changes to Zok are documented here.

The format follows Keep a Changelog principles and uses calendar dates while the project remains pre-Gold-Master.

## [Unreleased]

### Added
- `IMPLEMENTATION-CHECKLIST.md` as the evidence-based operational release checklist.
- Explicit P0-P3 execution priorities and Gold Master blockers in `exec-planing.md`.
- Release-control synchronization rule requiring `CHANGELOG.md`, `exec-planing.md`, and `IMPLEMENTATION-CHECKLIST.md` to be updated together after each execution cycle.
- `server/storage/json-storage.js` as the first storage-boundary slice, exposing a tested JSON adapter contract for `read()` and serialized `update()` operations.
- `test/storage.test.js` covering initialization, concurrent mutation serialization, atomic temporary-file cleanup, and corrupt-state fail-closed behavior.
- Initial PostgreSQL data-model DDL in `server/storage/postgres/migrations/001_initial.up.sql` with tenant-scoped tables for tenants, roles/users, contacts/conversations/messages, campaigns, integrations, consent, sessions, and audit events, plus explicit rollback DDL in `001_initial.down.sql`.
- `test/postgres-schema.test.js` as a structural regression contract for required tables, tenant ownership foreign keys, scoped uniqueness, constrained status/direction fields, and rollback coverage.
- PostgreSQL 17 service-backed CI verification with `test/postgres-migration-runtime.test.js` executing migration up, down, replayed up, and final rollback against a real database.
- `scripts/postgres-migrations.js` as the minimal migration executor used by the runtime migration test.

### Changed
- Refreshed `exec-planing.md` into the canonical master execution ledger for the current Vite + React + Express architecture.
- Clarified that UI simulations, demo metrics, mock integrations, and local AI behavior are not production evidence.
- Defined verification Gates A-D covering dependencies, tests/static checks, production-shaped runtime smoke, and external enterprise release evidence.
- Began P0 durable-storage work with an isolated adapter contract; the Express request path is not yet switched to that adapter.
- PostgreSQL migrations are now executed and rolled back in CI; this does not yet mean the live Express runtime uses PostgreSQL.
- `.github/workflows/ci.yml` now provisions a health-checked PostgreSQL 17 service for migration verification while retaining least-privilege repository permissions and the existing test/lint/typecheck/build/audit gates.

### Verification evidence
- JSON storage TDD red: CI run `32329601944` failed on the intentionally absent adapter; the existing API test remained green.
- PostgreSQL schema TDD red: CI run `32330472344` failed on intentionally absent migration files; existing API and JSON storage tests remained green.
- PostgreSQL schema green: CI run `32330521144` passed release-document checks, `npm ci`, tests, lint, typecheck, build, and production dependency audit.
- PostgreSQL runtime-migration TDD red: CI run `32330868918` started a healthy PostgreSQL 17 service and failed only because `scripts/postgres-migrations.js` was intentionally absent.
- Runtime migration green: CI run `32330980037` passed PostgreSQL service initialization, real migration up/down/replay verification, all tests, lint, typecheck, build, and `npm audit --omit=dev --audit-level=high`.

### Release status
- FOUNDATION HARDENED / NOT GOLD MASTER.
- Parent P0 durable PostgreSQL cutover remains incomplete because `server.js` still serves the live JSON persistence path and no production PostgreSQL adapter/connection pool/transaction boundary is wired yet.

## [2026-08-10]

### Security and runtime hardening
- Removed hardcoded demo credentials from the canonical login path.
- Added authenticated session handling, CSRF/origin checks, rate limiting, validation, safe error handling, and security headers.
- Added health verification and serialized atomic JSON persistence behavior.
- Established Vite + React frontend with Express adapter as the canonical runtime.
- Added test, lint, typecheck, build, and production dependency audit release gates.

### Known release blockers
- Durable multi-tenant database production cutover remains incomplete.
- Enterprise identity/RBAC/audit governance remains incomplete.
- Real channel/POS adapters and durable queue workers remain incomplete.
- AI policy/evaluation service remains incomplete.
- Independent security, load, disaster-recovery, privacy, and production-edge evidence remain incomplete.
