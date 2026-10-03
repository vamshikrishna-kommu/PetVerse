# PetVerse — Production Deployment Sign-Off Checklist

This checklist must be audited and signed off by the engineering team before releasing PetVerse to staging or production environments.

---

## 1. Security & Authentication Sign-Off

| Checkpoint | Requirement | Verification Mechanism | Status |
| :--- | :--- | :--- | :--- |
| **Cryptographic JWT Secrets** | Minimum 32-character high-entropy secret; no default fallback strings. | `apps/api/src/config/env.ts` enforces `min(32)` and rejects default keywords. | [x] PASSED |
| **Secure Cookies** | `secure: true`, `httpOnly: true`, `sameSite: 'strict'` / `'none'` in production. | In `NODE_ENV=production`, cookies sent over HTTPS only. | [x] PASSED |
| **CORS Origins** | Strict whitelist matching production frontend domain; no `*` wildcard with credentials. | Express CORS middleware verifies origin against comma-delimited `CORS_ORIGIN`. | [x] PASSED |
| **Account Lockout** | 5 consecutive failed login attempts locks account for 15 minutes (`HTTP 423 Locked`). | Tested in `apps/api/src/modules/auth/__tests__/auth.service.test.ts`. | [x] PASSED |
| **Password Hashing** | Bcrypt with salt rounds `>= 12`. | Enforced in `user.model.ts` pre-save hooks. | [x] PASSED |
| **Rate Limiting** | Tiered rate limiting (General API: 100/15min, Auth: 10/15min, AI/Payment: 20/15min). | `express-rate-limit` + Redis store in `apps/api/src/middlewares/rateLimiter.ts`. | [x] PASSED |
| **Zero-Secret Commit Guarantee** | No private keys, service tokens, or `.env` files committed to Git. | Automated GitHub Actions step scans commits using regex before building. | [x] PASSED |

---

## 2. Database & Data Integrity Sign-Off

| Checkpoint | Requirement | Verification Mechanism | Status |
| :--- | :--- | :--- | :--- |
| **Replica Set Active** | MongoDB instance configured as a replica set (`rs0` or MongoDB Atlas). | Required for Mongoose multi-document transactions in appointments and audits. | [x] PASSED |
| **Connection Pooling** | `maxPoolSize: 50`, `minPoolSize: 10`, `maxIdleTimeMS: 30000`. | Configured in `apps/api/src/config/database.ts`. | [x] PASSED |
| **Retryable Operations** | `retryWrites: true`, `retryReads: true` enabled on MongoDB client. | Configured in `database.ts`. | [x] PASSED |
| **Graceful Shutdown** | `SIGTERM` and `SIGINT` signals drain active database operations before closing. | Handler attached to process signals in `database.ts` & `index.ts`. | [x] PASSED |
| **No Production Seed Data** | Automatic fake seeding blocked in production. | Protected by `NODE_ENV === 'production'` checks. | [x] PASSED |

---

## 3. Third-Party Service Integrations Sign-Off

| Integration | Minimum Required Credentials | Production Validation Method | Status |
| :--- | :--- | :--- | :--- |
| **Stripe Payments** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Validated at startup via `auditExternalServices()`. Webhook signature validated. | [x] PASSED |
| **Google Gemini AI** | `GEMINI_API_KEY` | Server-side validation, safe veterinary disclaimer fallback on failure. | [x] PASSED |
| **Cloudinary Media** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Validated at startup; direct client credentials never exposed to browser. | [x] PASSED |
| **SendGrid / SMTP** | `SENDGRID_API_KEY` or `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` | Startup audit warnings if unconfigured; fallback to graceful logging in dev. | [x] PASSED |
| **Google OAuth** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Server-side token verification against Google identity endpoints. | [x] PASSED |
| **Firebase Cloud Messaging** | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Server-side push notification routing with structured error handling. | [x] PASSED |

---

## 4. Container & Infrastructure Sign-Off

| Checkpoint | Requirement | Verification Mechanism | Status |
| :--- | :--- | :--- | :--- |
| **Non-Root Docker User** | API container must run as unprivileged `node` user (`USER node`). | Configured in `apps/api/Dockerfile`. | [x] PASSED |
| **Multi-Stage Builds** | Build dependencies and devDependencies excluded from final runner image. | Implemented in `apps/api/Dockerfile` & `apps/web/Dockerfile`. | [x] PASSED |
| **Web Server Security Headers** | `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `CSP`. | Configured in `apps/web/nginx.conf` and `apps/web/vercel.json`. | [x] PASSED |
| **SPA Route Rewriting** | Deep routes (`/pets/:id`, `/appointments`, etc.) must fallback to `index.html`. | Configured in Nginx (`try_files $uri /index.html`) & Vercel (`routes`). | [x] PASSED |
| **Asset Caching** | Static assets (`/assets/*`, `.js`, `.css`, `.png`) cached with `immutable`. | Configured with `Cache-Control: public, max-age=31536000, immutable`. | [x] PASSED |

---

## 5. Observability, Auditing & Health Probes

| Checkpoint | Endpoint / Feature | Behavior | Status |
| :--- | :--- | :--- | :--- |
| **Liveness Probe** | `GET /health` | Returns HTTP 200 with uptime, system memory, and node version. | [x] PASSED |
| **Readiness Probe** | `GET /ready` | Pings MongoDB database and verifies replica set state. Returns HTTP 503 if down. | [x] PASSED |
| **Metrics Endpoint** | `GET /metrics` | Returns average latency, p95 latency, total requests, and slow requests. | [x] PASSED |
| **Performance Tracking** | `X-Response-Time` | Injected into all HTTP response headers; warning logged if `> 500ms`. | [x] PASSED |
| **Admin Audit Trail** | `GET /api/v1/users/admin/audit-logs` | Logs role changes, user activations/deactivations with IP and actor ID. | [x] PASSED |

---

## 6. Pre-Deployment Command Runbook

Execute this verification sequence prior to triggering production deployment:

```bash
# 1. Verify TypeScript types across the monorepo
pnpm --filter @petverse/api run type-check
pnpm --filter @petverse/web run type-check

# 2. Verify ESLint rules
pnpm --filter @petverse/web run lint

# 3. Execute backend integration & unit tests
pnpm --filter @petverse/api test

# 4. Execute frontend component & hook tests
pnpm --filter @petverse/web test

# 5. Execute production build
pnpm run build
```

**Approval Sign-off:** Lead Full-Stack Engineer  
**Status:** READY FOR PRODUCTION DEPLOYMENT
