# Architecture Audit Report

**Repository:** cvsz/zok  
**Auditor:** Principal Architect  
**Status:** Verified  

---

## 1. Frontend Architecture
- **Framework & Bundler:** React 18 SPA bundled via Vite 8.
- **Routing:** Component-based view switcher in `src/App.jsx` (`Dashboard`, `Chat`, `Campaigns`, `Integrations`, `Analytics`, `AiSettings`).
- **Styling:** Tailwind CSS 3.4 + Custom CSS tokens in `src/index.css` with dark mode support. Primary brand token `#00c28e` (Zok Emerald Green).
- **Icons:** `lucide-react` utilized uniformly across views.
- **State Management:** Reactive local state with simulated latencies for realistic UX feedback.

## 2. Backend Architecture
- **HTTP Server:** Express 5.2 on Node.js 22.
- **Security Middleware:** Strict CORS, reverse proxy trust (`server/edge/reverse-proxy.js`), secure cookie configuration (`server/edge/secure-cookies.js`), CSRF validation (`server/security/csrf.js`), and rate-limiting store (`server/storage/postgres/rate-limit-store.js`).
- **Authentication & RBAC:** Session-based authentication with PBKDF2 password hashing (`server/utils/password.js`) and tenant-scoped role-based access control (`server/storage/postgres/rbac-middleware.js`).
- **API Key & Secrets Management:** Encrypted secret vault (`server/security/secrets-vault.js`) with Argon2/SHA-256 key management (`server/security/api-key-manager.js`).

## 3. Storage & Dual-Mode Strategy
- **Default Storage:** Serialized atomic JSON file storage (`server/storage/json-storage.js`) with mutation queues and rollback preservation.
- **PostgreSQL Storage:** Activated when `ZOK_CHAT_STORAGE=postgres` with Row-Level Security (RLS) enforcement, tenant isolation, and connection pooling.
- **Metadata Protection:** `snapshotChatActivityMetadata` and `restoreChatActivityMetadata` preserve PostgreSQL-owned `time` and `unread` counts during legacy JSON writebacks.

## 4. Multi-Channel Messaging & Commerce
- **Channel Adapters:** WhatsApp, LINE, Messenger, TikTok adapters under `server/channels/adapters/` with signature verification (`webhook-verifier.js`) and idempotency stores (`idempotency-store.js`).
- **Commerce Adapters:** Shopify and TikTok Shop integrations under `server/commerce/adapters/` with order attribution and financial reconciliation engines.
