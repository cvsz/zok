# Changelog

All notable release-control and implementation changes to Zok are documented here.

The format follows Keep a Changelog principles and uses calendar dates while the project remains pre-Gold-Master.

## [Unreleased]

### Added
- `IMPLEMENTATION-CHECKLIST.md` as the evidence-based operational release checklist.
- Explicit P0-P3 execution priorities and Gold Master blockers in `exec-planing.md`.
- Release-control synchronization rule requiring `CHANGELOG.md`, `exec-planing.md`, and `IMPLEMENTATION-CHECKLIST.md` to be updated together after each execution cycle.

### Changed
- Refreshed `exec-planing.md` into the canonical master execution ledger for the current Vite + React + Express architecture.
- Clarified that UI simulations, demo metrics, mock integrations, and local AI behavior are not production evidence.
- Defined verification Gates A-D covering dependencies, tests/static checks, production-shaped runtime smoke, and external enterprise release evidence.

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
