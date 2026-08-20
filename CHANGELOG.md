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

### Changed
- Refreshed `exec-planing.md` into the canonical master execution ledger for the current Vite + React + Express architecture.
- Clarified that UI simulations, demo metrics, mock integrations, and local AI behavior are not production evidence.
- Defined verification Gates A-D covering dependencies, tests/static checks, production-shaped runtime smoke, and external enterprise release evidence.
- Began P0 durable-storage work with an isolated adapter contract; the Express request path is not yet switched to that adapter.
- Defined the initial PostgreSQL schema contract, but did not claim runtime migration execution, PostgreSQL adapter wiring, tenant-isolation enforcement, or production cutover.

### Verification evidence
- TDD red for the PostgreSQL schema slice: CI run `32330472344` failed only because `001_initial.up.sql` and `001_initial.down.sql` were intentionally absent; existing API hardening and JSON storage tests passed.
- Green verification after adding the DDL: CI run `32330521144` passed release-document checks, `npm ci`, tests, lint, typecheck, build, and `npm audit --omit=dev --audit-level=high`.

### Release status
- FOUNDATION HARDENED / NOT GOLD MASTER.

## [2026-08-10]

### Security and runtime hardening
- Removed hardcoded demo credentials from the canonical login path.
- Added authenticated session handling, CSRF/origin checks, rate limiting, validation, safe error handling, and security headers.
- Added health verification and serialized atomic JSON persistence behavior.
- Established Vite + React frontend with Express adapter as the canonical runtime.
- Added test, lint, typecheck, build, and production dependency audit release gates.

### Known release blockers
- Durable multi-tenant database and migrations remain incomplete.
- Enterprise identity/RBAC/audit governance remains incomplete.
- Real channel/POS adapters and durable queue workers remain incomplete.
- AI policy/evaluation service remains incomplete.
- Independent security, load, disaster-recovery, privacy, and production-edge evidence remain incomplete.
