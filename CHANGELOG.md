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
- Tenant-scoped contacts and conversations/messages repositories with validated input semantics and real PostgreSQL coverage.
- Pure legacy-chat compatibility mapper with deterministic `legacy-chat:<id>` contact/thread IDs and indexed message IDs, explicit sender/direction mapping, metadata preservation, and fail-closed validation.
- `server/storage/postgres/legacy-chat-runtime.js` as an authenticated request → tenant transaction → normalized conversations repository boundary for already-imported legacy chat threads.
- `server/storage/postgres/chat-route-gate.js` with explicit `ZOK_CHAT_STORAGE=json|postgres` selection. JSON is the default and rollback mode; PostgreSQL mode requires `ZOK_POSTGRES_URL` and refuses to start without it.
- PostgreSQL service-backed Express API regression coverage for the gated chat message path using a non-superuser `NOBYPASSRLS` application role.

### Changed
- `server.js` delegates filesystem persistence to `createJsonStorage` rather than owning JSON write internals.
- PostgreSQL transaction callbacks expose only the already-validated tenant ID to repository code.
- Durable-data execution proceeds through bounded, reversible route slices rather than a monolithic cutover.
- Legacy display-only message times are preserved as metadata rather than fabricated as database timestamps.
- The bounded legacy runtime maps `customer` → inbound/customer, `agent` → outbound/agent, `bot` → outbound/ai, and `system` → outbound/system.
- When `ZOK_CHAT_STORAGE=postgres`, `/api/chats` obtains message history from the request-bound PostgreSQL runtime and `/api/chats/:id/messages` persists both the requested message and simulated reply through PostgreSQL. Existing authentication, CSRF, request validation, and legacy response shape remain in place.
- Chat metadata, unread state, tags, and all non-chat resources remain JSON-backed in this slice. Missing expected `legacy-chat:<id>` imports fail closed with `503` instead of silently falling back to JSON messages.
- With the default `ZOK_CHAT_STORAGE=json`, the pre-existing JSON chat behavior remains unchanged and is the explicit rollback path.

### Verification evidence
- JSON adapter red `32329601944`; subsequent adapter green.
- PostgreSQL schema red/green `32330472344` / `32330521144`.
- Migration runtime red/green `32330868918` / `32330980037`.
- Tenant RLS red/green `32331153421` / `32331262316`.
- Tenant relational integrity red/green `32331342959` / `32331409295`.
- Concurrent integrity green `32331479289`.
- Express storage-boundary red/green `32333253897` / `32333372481`.
- PostgreSQL identity transaction red/green `32337912124` / `32337964164`.
- Real PostgreSQL pool red `32344793562`; test-isolation race `32344862826`; isolated real pool/RLS green `32344957870`.
- Express tenant principal red/green `32345044007` / `32345360432`.
- Request-to-transaction helper red/green `32345449008` / `32345518040`.
- Contacts repository red `32345736541`; harness defect `32345808587`; tenant-context red/green `32345984084` / `32346064982`.
- Conversations/messages repository red/green `32346149065` / `32346242401`.
- Real normalized relational repository integration green `32346343315`.
- Legacy compatibility mapping: test-first `26906f28c34d74077c3e496d0ddbf1ab21a080fb`, implementation `777af487395161b74fc1be472d1f5ddd448c73fb`, lint repair `42c1c4995de3f3a22d743f53dd6a630747a32884`, green CI `32351874076`.
- Bounded request-bound runtime: repository primitives `d2440a7d9c6d94fb510a24c92dc68c8dd91bd8af`, runtime `e95d2751804bed7c7a3b9ff055b5108829de8a54`, regression coverage `81abadeb91261ebeb232ca71d3fed88069f40223`, green CI `32357209712`; final synchronized PR #15 head also passed CI `32357391343` before merge.
- Configuration-gated route slice: gate helper `6eb110c4008b8fd8646fbd07a9c37d981e639da1`, Express route integration `7ca81445a222ba901413d95df8b5074a496b94f0`, PostgreSQL service-backed API regression `542bf524de74d4d87fdee978a38bf61e30fa298f`.
- Implementation-head CI `32362476402` passed release-control document checks, PostgreSQL service/client verification, `npm ci`, tests, lint, typecheck, production build, and production dependency audit.

### Repository state
- PR #6 was squash-merged to `main` as `edbc8ba85a534e49fe3881b24c8a55560671421f` after green CI `32352025017`.
- PR #15 was merged on 2026-08-20 after its request-bound runtime and synchronized head were green; it is no longer an open/draft dependency for route work.
- Main subsequently advanced through separately scoped Dependabot PR #12 to `66142a5a98229efd6035ffacf184dfb896fbb76f`; other major-version Dependabot PRs remain separate from this P0 durable-data track.
- Draft PR #16 (`feat/postgres-chat-route-gate`) contains the bounded configuration-gated chat message route work. It is intentionally unmerged pending normal review/authorization.

### Residual risks / not claimed
- No full live-data cutover has occurred. Only an opt-in chat **message** read/write slice is PostgreSQL-capable.
- Chat metadata, unread state, tags, campaigns, integrations, AI config, and flow state remain JSON-backed.
- Production JSON→PostgreSQL import, dry-run/idempotency/resume, cutover, and rollback evidence are not yet complete; PostgreSQL mode assumes required legacy thread imports already exist and fails closed when they do not.
- Backup/restore RPO/RTO evidence, production multi-user tenant identity/RBAC, append-only audit enforcement, shared session/rate-limit state, provider delivery controls, AI governance, and Gate D remain incomplete.
- Local clone/install verification was unavailable in this automation environment because `github.com` DNS resolution failed; GitHub Actions is the execution evidence for this slice.

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
