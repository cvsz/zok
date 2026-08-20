# Changelog

All notable release-control and implementation changes to Zok are documented here.

The format follows Keep a Changelog principles and uses calendar dates while the project remains pre-Gold-Master.

## [Unreleased]

### Added
- `IMPLEMENTATION-CHECKLIST.md` as the evidence-based operational release checklist.
- Tested JSON storage boundary and Express architecture regression coverage.
- Initial normalized PostgreSQL schema + rollback migrations for tenants, users/roles, contacts/conversations/messages, campaigns, integrations, consent, sessions, and audit events.
- PostgreSQL 17 migration up/down/replay, forced RLS, tenant relational-integrity, and real pool verification.
- `server/storage/postgres-storage.js` with real `pg.Pool`, explicit transaction boundaries, transaction-local tenant context, rollback, guaranteed client release, and authenticated identity binding.
- Tenant-scoped contacts and conversations/messages repositories with real PostgreSQL/RLS coverage.
- Pure legacy-chat compatibility mapper with deterministic `legacy-chat:<id>` contact/thread IDs and indexed message IDs.
- `server/storage/postgres/legacy-chat-runtime.js` as an authenticated request → tenant transaction → normalized conversations repository boundary.
- `server/storage/postgres/chat-route-gate.js` with explicit `ZOK_CHAT_STORAGE=json|postgres`; JSON remains the default/rollback mode and PostgreSQL mode requires `ZOK_POSTGRES_URL`.
- PostgreSQL service-backed Express API regression coverage for the gated chat message path using a non-superuser `NOBYPASSRLS` application role.
- Draft PR #17 adds `server/storage/postgres/legacy-chat-import.js`, a deterministic legacy chat JSON→PostgreSQL importer that validates source records through the existing compatibility mapper, reuses stable external IDs on exact replay, and fails closed on duplicate, ambiguous, or conflicting replay state.
- Draft PR #17 adds `scripts/import-legacy-chats.js`; `--dry-run` validates and counts without acquiring PostgreSQL storage, while write mode requires `ZOK_POSTGRES_URL` and a valid tenant UUID.
- PostgreSQL service-backed import regression coverage verifies first import creation, exact replay without duplicate rows, and conflicting replay rejection without adding messages.
- Draft PR #17 now adds source-bound resumable import checkpoints. Checkpoints contain version, tenant, deterministic normalized-source SHA-256 digest, next chat index, and total chat count.
- `scripts/import-legacy-chats.js` supports `--checkpoint <file>` and `--resume`; checkpoint files are replaced atomically after each committed chat and resume fails closed if tenant/source/progress metadata does not match.
- PostgreSQL service-backed interruption/restart regression verifies that a checkpoint is emitted only after a per-chat transaction commits, an injected interruption leaves only committed progress, and restart resumes from the next chat without duplicating earlier rows.

### Changed
- `server.js` delegates filesystem persistence to `createJsonStorage` rather than owning JSON write internals.
- PostgreSQL transaction callbacks expose only the already-validated tenant ID to repository code.
- Durable-data execution proceeds through bounded, reversible slices rather than a monolithic cutover.
- Legacy display-only message times are preserved as metadata rather than fabricated as database timestamps.
- When `ZOK_CHAT_STORAGE=postgres`, `/api/chats` message history and `/api/chats/:id/messages` persistence use the request-bound PostgreSQL runtime; auth, CSRF, validation, and legacy response shape remain in place.
- Chat metadata, unread state, tags, and all non-chat resources remain JSON-backed. Missing expected `legacy-chat:<id>` imports fail closed instead of silently falling back to JSON message history.
- PR #16 is now recorded as merged rather than draft/unmerged. It merged as `dc677799cbac6ee793a612330313b1c39f5cc7ca` after synchronized-head CI `32362766907` passed.
- Legacy chat import write execution now commits one validated chat per tenant-scoped transaction so durable checkpoint progress can represent a completed transaction boundary. This intentionally permits partial-but-restartable import state; it does not claim concurrent importer serialization.

### Verification evidence
- PostgreSQL schema CI `32330521144`; migration runtime `32330980037`; tenant RLS `32331262316`; relational integrity `32331409295`; concurrent integrity `32331479289`.
- Express storage boundary CI `32333372481`; identity transaction red/green `32337912124` / `32337964164`; real pool/RLS `32344957870`.
- Request-to-transaction and repository evidence: `32345518040`, `32346064982`, `32346242401`, `32346343315`.
- Legacy compatibility mapping: `26906f28c34d74077c3e496d0ddbf1ab21a080fb`, `777af487395161b74fc1be472d1f5ddd448c73fb`, repair `42c1c4995de3f3a22d743f53dd6a630747a32884`, CI `32351874076`.
- Bounded request-bound runtime: `d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af`, `e95d2751804bed7c7a3b9ff055b5108829de8a54`, `81abadeb91261ebeb232ca71d3fed88069f40223`, CI `32357209712`, synchronized-head CI `32357391343`.
- Configuration-gated route slice: `6eb110c4008b8fd8646fbd07a9c37d981e639da1`, `7ca81445a222ba901413d95df8b5074a496b94f0`, `542bf524de74d4d87fdee978a38bf61e30fa298f`, implementation-head CI `32362476402`, synchronized-head CI `32362766907`, merge `dc677799cbac6ee793a612330313b1c39f5cc7ca`.
- Deterministic chat import foundation on draft PR #17: importer `a94042d1fc5dc2b013261167c26c96c5d433fac2`, CLI `24b10ae585bcd52bc87c0ff7cc20922e00d7ae0f`, structural replay comparison `becd258ef396e43732816fdc6d0ae5055c5fe6d8`, service-backed tests `abc559a7593d657a373cd645eea90295268f4ca0`, implementation CI `32367095289`, synchronized-head CI `32367337923`.
- Resumable/checkpointed chat import slice: checkpointed importer `4ec62fd68bf7a786edc585918a12c23e6f6422f4`, atomic checkpoint CLI `a3790630253fb095f11c27613d3796f5682d556c`, interruption/restart and source-bound checkpoint tests `7616dfc8eb23cd7fc3bf0b2ea7e2e71fc928cfed`.
- Resumability implementation-head CI `32372290510` passed release-control document checks, PostgreSQL service/client verification, `npm ci`, tests, lint, typecheck, production build, and production dependency audit.

### Repository state
- PR #6 merged the PostgreSQL schema/RLS/transaction/repository/legacy-mapping foundation as `edbc8ba85a534e49fe3881b24c8a55560671421f`.
- PR #15 merged the bounded request-bound legacy chat runtime after green implementation and synchronized-head CI.
- PR #16 merged the configuration-gated chat message read/write slice as `dc677799cbac6ee793a612330313b1c39f5cc7ca`.
- Current `main` baseline for PR #17 is `29f0055d439fda5cf5ac8bab5d8755b371be1817`.
- Draft PR #17 (`feat/postgres-chat-import`) is open and intentionally unmerged.
- Remaining open dependency PRs are separately scoped Dependabot updates and remain outside this P0 durable-data slice.

### Residual risks / not claimed
- This import slice now proves validation, dry-run behavior, exact ordinary replay idempotency, deterministic source-bound checkpoints, and interruption/restart continuation against PostgreSQL CI.
- Concurrent importer serialization is not proven; operators must not run competing imports for the same tenant/source until a concurrency policy is implemented and verified.
- Production chat cutover and explicit rollback verification remain incomplete.
- Chat metadata, unread state, tags, campaigns, integrations, AI config, and flow state remain JSON-backed.
- Application-wide JSON→PostgreSQL cutover and backup/restore RPO/RTO evidence remain incomplete.
- Production multi-user tenant identity/RBAC, append-only audit enforcement, shared session/rate-limit state, provider delivery controls, AI governance, and Gate D remain incomplete.
- Local clone/install verification is unavailable in the automation environment because `github.com` DNS resolution fails; GitHub Actions is the execution evidence for this slice.

### Release status
- **FOUNDATION HARDENED / NOT GOLD MASTER.**

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
