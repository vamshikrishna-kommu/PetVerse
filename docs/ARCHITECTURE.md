# PetVerse — System Architecture & Technical Design

PetVerse is an intelligent, full-stack pet care, medical lifecycle, community safety, and clinic appointment ecosystem built as a modern TypeScript monorepo.

---

## 1. Monorepo Organization

```
PetVerse/
├── apps/
│   ├── api/                   # Express + TypeScript Modular Backend
│   │   ├── src/
│   │   │   ├── config/        # Environment, DB, Readiness, Logger
│   │   │   ├── middlewares/   # Auth, Error, RateLimit, Performance, Upload
│   │   │   ├── modules/       # Domain Modules (Auth, Pets, Health, Vaccination, etc.)
│   │   │   │   └── <module>/  # Model, Repository, Service, Controller, Routes
│   │   │   └── shared/        # Errors, Utils, Validation Schemas
│   │   └── Dockerfile
│   └── web/                   # React 19 + Vite 8 + Tailwind CSS 4 Frontend
│       ├── src/
│       │   ├── app/           # Router, Global Stores, Providers
│       │   ├── features/      # Feature Pages, Hooks, APIs, Components
│       │   └── shared/        # Reusable UI, Feedback, Layout, Utilities
│       ├── Dockerfile
│       ├── nginx.conf
│       └── vercel.json
├── packages/
│   ├── shared-types/          # Domain TypeScript interfaces (IPet, IUser, etc.)
│   └── shared-constants/      # System-wide Enums, Error Codes, API Routes
├── docs/                      # Architectural, Deployment, and API documentation
└── docker-compose.yml         # Container Orchestration
```

---

## 2. Backend Design Patterns

### Service-Repository Layering
- **Models (Mongoose Schemas)**: Enforce strict schema constraints, validation rules, toJSON redactions (e.g. omitting password hashes and sensitive tokens), and indexes (2dsphere geospatial, unique email).
- **Repositories**: Abstract database persistence queries (`findById`, `updateById`, `exists`, `findWithinRadius`).
- **Services**: Pure business logic, validation, third-party provider coordination, audit logging, and domain event dispatch.
- **Controllers**: Express request parsing, schema validation, and structured JSON envelope formatting (`apiResponse.success()`, `apiResponse.created()`).

### Event Bus & Background Worker
- **Event Bus (`EventEmitter`)**: Decouples domain actions (e.g. `appointment:booked`, `reminder:due`, `prescription:created`) from asynchronous side-effects (push notifications, emails).
- **Reminder Cron Worker (`node-cron`)**: Polls due reminders every minute with database query filters (`nextTrigger <= now`, `isActive: true`, `status: scheduled`). Supports standard cron expressions (`0 8 * * *`) and auto-escalation.

---

## 3. Security Architecture

1. **Authentication & Token Lifecycle**:
   - Short-lived Access Tokens (JWT, 15 minutes).
   - Long-lived Refresh Tokens (JWT, 7 days) stored in secure, `httpOnly`, `sameSite: strict` cookies scoped strictly to `/api/v1/auth/refresh`.
   - **Token Rotation & Family Invalidation**: Reusing a previously consumed refresh token invalidates the entire token family, terminating active sessions to stop token theft attacks.
2. **Account Lockout Protection**:
   - Accounts track consecutive failed login attempts.
   - Upon 5 consecutive failed attempts, the account is locked for 15 minutes (`HTTP 423 Locked`).
   - Successful authentication resets the failure counter.
3. **Role-Based Access Control (RBAC)**:
   - User roles: `pet_owner`, `vet`, `shelter`, `admin`.
   - `requireRole('admin')` protects management endpoints, user status toggling, and audit log inspection.
4. **Audit Logging**:
   - Administrative actions (`USER_ACTIVATED`, `USER_DEACTIVATED`, `USER_ROLE_CHANGED`) are persistently logged in `AuditLogModel` with actor email, IP address, user-agent, and before/after payloads.
5. **Rate Limiting & Headers**:
   - Global rate limiter (100-300 req / 15 min window).
   - Strict auth rate limiter (10-20 req / 1 min window).
   - `helmet` security headers enabled with CSP.

---

## 4. Third-Party Integration Matrix

| Service | Provider | Purpose | Fallback / Mock Behavior |
| :--- | :--- | :--- | :--- |
| **Email Delivery** | SendGrid | Email OTP verification, appointment notices | Console logger in `development`/`test` |
| **Object Storage** | Cloudinary | Pet photos, medical PDFs, vaccine cards | Local memory buffer handling in tests |
| **Push Alerts** | Firebase FCM | Native browser/mobile push notifications | In-app notification queue fallback |
| **Payments** | Stripe | Appointment booking prepayment, webhooks | Server-side idempotency verification |
| **AI Diagnostics** | Google Gemini | Symptom analysis, breed scan, nutrition | Safe veterinary disclaimer fallback |
| **Geospatial** | Google Maps | Clinic locator, emergency veterinary finder | Leaflet / OpenStreetMap fallback |
