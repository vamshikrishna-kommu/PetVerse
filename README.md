# 🐾 PetVerse — Intelligent AI-Powered Pet Care & Management Ecosystem

> **India's #1 Comprehensive Pet Care & Management Platform**  
> Empowering pet parents, clinics, veterinarians, and service providers with intelligent health tracking, appointments, telehealth, emergency pet SOS, lost & found radar, and seamless UPI/Razorpay payments.

[![CI](https://github.com/vamshikrishna-kommu/PetVerse/actions/workflows/ci.yml/badge.svg)](https://github.com/vamshikrishna-kommu/PetVerse/actions/workflows/ci.yml)
[![CD](https://github.com/vamshikrishna-kommu/PetVerse/actions/workflows/cd.yml/badge.svg)](https://github.com/vamshikrishna-kommu/PetVerse/actions/workflows/cd.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.14.4-orange.svg)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 📑 Table of Contents

1. [PetVerse Overview](#-petverse-overview)
2. [Architecture & System Design](#-architecture--system-design)
3. [Monorepo Structure](#-monorepo-structure)
4. [Prerequisites](#-prerequisites)
5. [Installation](#-installation)
6. [Environment Setup](#-environment-setup)
7. [Local Development](#-local-development)
8. [Service Configuration](#-service-configuration)
   - [MongoDB Setup](#mongodb-setup)
   - [Redis Setup (Optional)](#redis-setup-optional)
   - [Google OAuth Setup](#google-oauth-setup)
   - [Cloudinary Setup](#cloudinary-setup)
   - [Firebase Cloud Messaging (FCM)](#firebase-cloud-messaging-fcm)
   - [Google Gemini AI Setup](#google-gemini-ai-setup)
   - [Razorpay Payments Setup (India-First)](#razorpay-payments-setup-india-first)
9. [Testing & Quality Assurance](#-testing--quality-assurance)
10. [Building for Production](#-building-for-production)
11. [Docker Deployment](#-docker-deployment)
12. [Cloud & Platform Deployment (Render & Vercel)](#-cloud--platform-deployment)
13. [Production Environment Variables Reference](#-production-environment-variables-reference)
14. [Security Policies & Best Practices](#-security-policies--best-practices)
15. [Post-Deployment Razorpay Webhook Configuration](#-post-deployment-razorpay-webhook-configuration)

---

## 🐾 PetVerse Overview

PetVerse is an intelligent, full-stack pet care ecosystem crafted for the Indian market and global pet owners. It provides:
- **Comprehensive Pet Records**: Dynamic health logs, vaccinations, medical history, allergies, and unique shareable Pet QR tags.
- **Appointments & Telehealth**: Booking vet appointments, home visits, and clinic sessions with automated reminder triggers.
- **India-First Payments**: Native support for UPI, RuPay cards, net banking, and wallets via Razorpay (with Stripe fallback for international cards).
- **AI Clinical Triage**: Smart symptom assessment and breed identification powered by Google Gemini 1.5 Flash with fallback to deterministic veterinary clinical engines.
- **Emergency SOS & Lost Pet Radar**: One-click geo-tagged SOS alerts, broadcast notifications, and nearby clinic navigation.
- **Automations & Smart Reminders**: Configurable automation builder for preventative pet care (deworming, vaccination schedules, recurring medication).

---

## 🏛 Architecture & System Design

PetVerse is structured as an enterprise-grade monorepo managed with **Turborepo** and **pnpm workspaces**:

```
                                  ┌────────────────────────┐
                                  │   Web Client (React)   │
                                  │    Vite / TailwindCSS  │
                                  └───────────┬────────────┘
                                              │ HTTP / JSON
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PetVerse API (Node / Express)                         │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Security: Helmet, CORS, RateLimiter, CookieParser, Timing-Safe Signatures  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────┬───────────────────┬───────────────────┬─────────────────┐ │
│ │ Auth & Google     │ Pets & Records    │ Appointments      │ India Payments  │ │
│ │ OAuth / JWT       │ Microchip / QR    │ Scheduling        │ Razorpay/Stripe │ │
│ ├───────────────────┼───────────────────┼───────────────────┼─────────────────┤ │
│ │ AI & Diagnostics  │ Reminders & SOS   │ Media Storage     │ Telemetry       │ │
│ │ Gemini / Rule-Eng │ MSG91 / Firebase  │ Cloudinary        │ Health/Metrics  │ │
│ └───────────────────┴───────────────────┴───────────────────┴─────────────────┘ │
└────────────────────────┬────────────────────────────┬───────────────────────────┘
                         │                            │
                         ▼                            ▼
              ┌─────────────────────┐      ┌─────────────────────┐
              │    MongoDB Atlas    │      │    Redis Cache      │
              │ (Mongoose / Replica)│      │  (BullMQ / Queue)   │
              └─────────────────────┘      └─────────────────────┘
```

---

## 📦 Monorepo Structure

```
PetVerse/
├── apps/
│   ├── api/                     # Node.js + Express + TypeScript Backend
│   │   ├── src/
│   │   │   ├── config/          # Environment validation (Zod), MongoDB, Readiness
│   │   │   ├── middlewares/     # Auth (JWT), Rate limiting, Validation, Error handler
│   │   │   ├── modules/         # Modular feature domains:
│   │   │   │   ├── auth/        # JWT & Google OAuth authentication
│   │   │   │   ├── pets/        # Pet profiles & QR microchips
│   │   │   │   ├── appointments/# Scheduling & clinic consultations
│   │   │   │   ├── payments/    # Razorpay (India-first) + Stripe fallback + webhooks
│   │   │   │   ├── ai/          # Google Gemini Flash + Clinical rule engine
│   │   │   │   ├── notifications/# Firebase Cloud Messaging (FCM) & push
│   │   │   │   ├── reminders/   # Worker queue & cron reminders
│   │   │   │   └── lost-found/  # Community radar & lost pet alerts
│   │   │   └── shared/          # Shared utilities, logging (Winston), base models
│   │   ├── Dockerfile           # Multi-stage container build for API
│   │   └── package.json
│   │
│   └── web/                     # React 19 + Vite 6 + TailwindCSS Single-Page App
│       ├── src/
│       │   ├── app/             # Application shell, Zustand state stores, Router
│       │   ├── features/        # Modular UI features (pets, appointments, auth, ai, etc.)
│       │   └── shared/          # Reusable UI components, Axios instance, hooks
│       ├── Dockerfile           # Nginx Alpine container build for Web SPA
│       ├── nginx.conf           # SPA fallback routing and security headers
│       └── package.json
│
├── packages/
│   ├── shared-types/            # Shared TypeScript data contracts, interfaces, DTOs
│   └── shared-constants/        # Shared system constants, India defaults, API prefixes
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # Automated CI: Type-check, Lint, Test, Build
│       └── cd.yml               # Automated CD: Secret scanning, Docker build validation
│
├── docs/                        # Complete architecture audits and technical specs
├── docker-compose.yml           # Production Docker Compose orchestration
├── docker-compose.dev.yml       # Local development Docker Compose overlay
├── render.yaml                  # Render Infrastructure-as-Code Blueprint
├── .env.example                 # Root configuration template with safe placeholders
├── package.json                 # Monorepo root manifest
├── pnpm-workspace.yaml          # Monorepo workspace boundaries
└── turbo.json                   # Turborepo task pipeline configuration
```

---

## ⚙️ Prerequisites

Ensure your development workstation meets these minimum requirements:
- **Node.js**: `v20.x` or higher (LTS recommended)
- **pnpm**: `v9.14.4` (Enable via `corepack enable && corepack prepare pnpm@9.14.4 --activate`)
- **MongoDB**: Local MongoDB `v7.x` instance OR MongoDB Atlas connection URI
- **Git**: `v2.40+`
- **Docker** *(Optional)*: Docker Engine `24.x+` with Docker Compose `v2.x`

---

## 🚀 Installation

Clone the repository and install all workspace dependencies using `pnpm`:

```bash
# Clone the repository
git clone https://github.com/vamshikrishna-kommu/PetVerse.git
cd PetVerse

# Enable corepack and install exact dependencies
corepack enable
corepack prepare pnpm@9.14.4 --activate
pnpm install --frozen-lockfile
```

---

## 🔐 Environment Setup

Never commit `.env` files containing real secrets to Git. Copy the provided templates:

```bash
# 1. Root template (for Docker & monorepo scripts)
cp .env.example .env

# 2. Backend API template
cp apps/api/.env.example apps/api/.env

# 3. Frontend Web template
cp apps/web/.env.example apps/web/.env
```

---

## 💻 Local Development

Run the full stack concurrently using Turborepo:

```bash
# Start both Backend API (:3000) and Frontend Web (:5173) in parallel
pnpm run dev
```

Or run individual apps independently:

```bash
# Run only Backend API
pnpm --filter @petverse/api run dev

# Run only Frontend Web
pnpm --filter @petverse/web run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Health**: [http://localhost:3000/health](http://localhost:3000/health)
- **API Readiness**: [http://localhost:3000/ready](http://localhost:3000/ready)
- **API Metrics**: [http://localhost:3000/metrics](http://localhost:3000/metrics)

---

## 🔌 Service Configuration

### MongoDB Setup
PetVerse requires MongoDB with replica sets enabled if multi-document ACID transactions are desired:
- **Local Docker**: Running `docker compose up mongodb mongo-init` automatically starts MongoDB 7 with replica set `rs0`.
- **MongoDB Atlas**:
  1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
  2. Whitelist your server IP (or `0.0.0.0/0` with strong password authentication).
  3. Set `MONGODB_URI` in `apps/api/.env`:
     ```env
     MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/petverse?retryWrites=true&w=majority
     ```

### Redis Setup (Optional)
Redis powers caching and the asynchronous reminder worker queue:
```env
REDIS_URL=redis://127.0.0.1:6379
```
*Note: If Redis is absent, PetVerse automatically falls back gracefully.*

### Google OAuth Setup
PetVerse uses Google Identity Services for one-tap sign-in:
1. Open the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (Web Application).
3. Add Authorized JavaScript Origins:
   - Development: `http://localhost:5173`
   - Production: `https://<YOUR_FRONTEND_DOMAIN>`
4. Set credentials:
   - Backend (`apps/api/.env`):
     ```env
     GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your-client-secret
     ```
   - Frontend (`apps/web/.env`):
     ```env
     VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     ```

### Cloudinary Setup
Used for storing pet avatars, medical reports, and vaccination cards:
1. Register on [Cloudinary](https://cloudinary.com/).
2. Copy credentials from Dashboard into `apps/api/.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

### Firebase Cloud Messaging (FCM)
Powers push notifications for appointment alerts and emergency broadcasts:
1. Create a project in [Firebase Console](https://console.firebase.google.com/).
2. Backend credentials in `apps/api/.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-key\n-----END PRIVATE KEY-----"
   ```
3. Frontend credentials in `apps/web/.env`:
   ```env
   VITE_FIREBASE_API_KEY=your-web-api-key
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_VAPID_KEY=your-vapid-public-key
   ```

### Google Gemini AI Setup
Powers intelligent symptom triage and breed diagnostics:
1. Generate an API Key at [Google AI Studio](https://aistudio.google.com/).
2. Set in `apps/api/.env` (**BACKEND ONLY — Never expose to frontend**):
   ```env
   GEMINI_API_KEY=AIzaSy...your-actual-key
   ```
*Note: If no Gemini key is provided, PetVerse activates its deterministic Clinical Rule Engine.*

### Razorpay Payments Setup (India-First)
PetVerse implements an India-first payment stack supporting UPI (Google Pay, PhonePe, Paytm), RuPay/Visa/MasterCard, Net Banking, and Wallets:
1. Create an account on [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Under **Account & Settings > API Keys**, generate a Test Key ID and Secret:
   - Backend (`apps/api/.env`):
     ```env
     RAZORPAY_KEY_ID=rzp_test_...
     RAZORPAY_KEY_SECRET=your-razorpay-key-secret
     RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret
     ```
   - Frontend (`apps/web/.env`):
     ```env
     VITE_RAZORPAY_KEY_ID=rzp_test_...
     ```
3. International Fallback (Optional): Stripe can be configured concurrently via `STRIPE_SECRET_KEY` and `VITE_STRIPE_PUBLISHABLE_KEY`.

---

## 🧪 Testing & Quality Assurance

Run the comprehensive automated test and quality suite:

```bash
# 1. Type-checking across all workspaces
pnpm run type-check

# 2. Linting (ESLint)
pnpm run lint

# 3. Unit, Integration, and Security Test Suites
pnpm run test

# 4. Filtered backend tests (197+ tests including failure paths & idempotency)
pnpm --filter @petverse/api test

# 5. Filtered frontend tests
pnpm --filter @petverse/web test
```

---

## 🏗 Building for Production

Compile production bundles for all apps and packages:

```bash
# Build all workspaces with Turborepo caching
pnpm run build
```

Artifacts will be output to:
- Backend: `apps/api/dist/`
- Frontend: `apps/web/dist/`

---

## 🐳 Docker Deployment

The repository includes production multi-stage Dockerfiles optimized for security (non-root users, alpine base images, dependency caching):

```bash
# Build and run the entire stack with Docker Compose
docker compose up -d --build

# View container logs
docker compose logs -f api
docker compose logs -f web

# Stop containers
docker compose down
```

---

## ☁️ Cloud & Platform Deployment

### Backend API on Render
A pre-configured [`render.yaml`](./render.yaml) is included for instant deployment:
1. Connect your GitHub repository to [Render](https://dashboard.render.com/).
2. Choose **New > Blueprint** and select `render.yaml`.
3. In the Render Dashboard under **Environment Variables**, supply your secret credentials (`MONGODB_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `GEMINI_API_KEY`, `JWT_SECRET`, etc.).
4. The service will build via `apps/api/Dockerfile` and automatically bind to Render's dynamic `PORT`.

### Frontend Web on Vercel
1. Import `apps/web` in [Vercel](https://vercel.com/).
2. Set Framework Preset to **Vite**.
3. Configure Environment Variables:
   - `VITE_API_BASE_URL=https://<your-render-api-domain>/api/v1`
   - `VITE_RAZORPAY_KEY_ID=rzp_live_...`
   - `VITE_GOOGLE_CLIENT_ID=...`
4. Deploy. Vercel utilizes the provided [`apps/web/vercel.json`](./apps/web/vercel.json) for client-side SPA routing and security headers.

---

## 📋 Production Environment Variables Reference

| Variable | Scope | Required | Description |
|:---|:---|:---:|:---|
| `NODE_ENV` | Backend | Yes | Set to `production` |
| `PORT` | Backend | Yes | Assigned by hosting provider (default: 3000 / 10000) |
| `FRONTEND_URL` | Backend | Yes | Production origin (e.g. `https://petverse.app`) for CORS & links |
| `MONGODB_URI` | Backend | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Backend | Yes | Minimum 32-character high-entropy secret |
| `JWT_REFRESH_SECRET` | Backend | Yes | High-entropy secret distinct from `JWT_SECRET` |
| `RAZORPAY_KEY_ID` | Backend | Yes | Live or Test Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | Backend | Yes | Razorpay API Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Backend | Yes | Webhook verification secret from Razorpay Dashboard |
| `GEMINI_API_KEY` | Backend | Optional | Google Gemini API Key for smart clinical triage |
| `GOOGLE_CLIENT_ID` | Backend | Optional | Google OAuth 2.0 Web Client ID |
| `GOOGLE_CLIENT_SECRET` | Backend | Optional | Google OAuth 2.0 Client Secret |
| `CLOUDINARY_CLOUD_NAME`| Backend | Optional | Cloudinary storage identifier |
| `CLOUDINARY_API_KEY` | Backend | Optional | Cloudinary API Key |
| `CLOUDINARY_API_SECRET`| Backend | Optional | Cloudinary API Secret |
| `VITE_API_BASE_URL` | Frontend | Yes | Full URL pointing to `/api/v1` of your deployed API |
| `VITE_RAZORPAY_KEY_ID` | Frontend | Yes | Public Razorpay Key ID matching backend |
| `VITE_GOOGLE_CLIENT_ID`| Frontend | Optional | Public Google OAuth Client ID |

---

## 🛡 Security Policies & Best Practices

- **Zero Secret Commits**: Real secrets must never be committed. `.gitignore` strictly rejects `.env`, `.env.*` (preserving only `.env.example`), and cloud credential files.
- **Timing-Safe Verifications**: HMAC signatures for both Razorpay webhooks and client payment confirmation are checked using `crypto.timingSafeEqual` to prevent timing attacks.
- **Strict Role-Based Access Control**: Appointments and medical records enforce strict server-side ownership verification (`ForbiddenError`).
- **Sanitized Headers**: Express is protected by `helmet`, strict CORS whitelists, cookie security (`httpOnly`, `sameSite`, `secure`), and multi-tier rate limiting.
- **Secret Separation**: Frontend bundles never receive private keys, webhook secrets, or API secrets.

---

## 🔔 Post-Deployment Razorpay Webhook Configuration

After your backend API is deployed:

1. Obtain your public API URL (e.g., `https://api.petverse.app`).
2. Log into the [Razorpay Dashboard](https://dashboard.razorpay.com/).
3. Navigate to **Settings > Webhooks > Add New Webhook**.
4. Enter the Webhook details:
   - **Webhook URL**: `https://<YOUR_DEPLOYED_DOMAIN>/api/v1/payments/webhook`
   - **Secret**: Generate a strong secret and set it as `RAZORPAY_WEBHOOK_SECRET` on your backend server.
   - **Alert Email**: Enter your security/ops alert email.
   - **Active Events**: Select:
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
5. Save the webhook. Incoming webhooks are automatically verified and processed idempotently.
