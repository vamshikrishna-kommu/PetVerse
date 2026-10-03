# PetVerse — Developer Setup & Onboarding Guide

Comprehensive setup guide for configuring, running, and developing within the **PetVerse** monorepo.

---

## 1. System Prerequisites

Ensure the following runtimes and tools are installed on your host machine:

| Component | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 20.12.0` | `v20.x` or `v22.x` | Runtime for API and Web build tooling |
| **pnpm** | `>= 9.0.0` | `9.14.x` | Monorepo package manager (`corepack enable pnpm`) |
| **MongoDB** | `>= 7.0` | `7.0.x` (Replica Set) | **Mongoose transactions require a replica set (`rs0`)** |
| **Redis** | `>= 7.0` | `7.2.x` | Required for BullMQ reminder worker, caching, and rate limiting |
| **Docker & Compose** | `>= 24.0` / Compose v2 | Latest Desktop/Engine | For containerized local development |
| **Git** | `>= 2.30` | Latest | Version control |

---

## 2. Quickstart with Docker Compose (Recommended)

The fastest way to spin up the entire PetVerse ecosystem (MongoDB Replica Set, Redis, API, and Frontend) with zero manual database configuration:

```bash
# 1. Clone repository
git clone https://github.com/petverse/petverse.git
cd petverse

# 2. Copy environment files
cp .env.example .env
cp apps/web/.env.example apps/web/.env

# 3. Launch the containerized development stack
docker compose -f docker-compose.dev.yml up --build
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **API Readiness Check**: [http://localhost:5000/ready](http://localhost:5000/ready)
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`

To shut down:
```bash
docker compose -f docker-compose.dev.yml down
```

---

## 3. Bare-Metal Development Setup

If running Node, MongoDB, and Redis directly on your host machine:

### Step 3.1: Install Dependencies
```bash
# Install root and workspace package dependencies
pnpm install
```

### Step 3.2: Configure Environment Files
PetVerse uses `.env` files in `apps/api/` and `apps/web/`:

```bash
# In the repository root:
cp .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Review [`.env.example`](../.env.example) and ensure your local variables are set:
- `PORT=5000`
- `NODE_ENV=development`
- `MONGODB_URI=mongodb://localhost:27017/petverse_dev?replicaSet=rs0`
- `REDIS_URL=redis://localhost:6379`
- `JWT_ACCESS_SECRET=local_jwt_secret_dev_key_at_least_32_characters_long`
- `JWT_REFRESH_SECRET=local_jwt_refresh_dev_key_at_least_32_characters_long`
- `CORS_ORIGIN=http://localhost:5173,http://localhost:3000`

### Step 3.3: Configure MongoDB Replica Set
PetVerse uses MongoDB transactions for atomic operations (e.g. appointment booking, account deletions, multi-collection workflows). Transactions require a replica set even in local development.

#### Windows (mongod.cfg):
Add replication settings to your MongoDB config:
```yaml
replication:
  replSetName: "rs0"
```
Restart MongoDB service, open `mongosh`, and initiate:
```javascript
rs.initiate()
```

#### macOS (Homebrew):
```bash
mongod --replSet rs0 --dbpath /usr/local/var/mongodb
# In mongosh:
rs.initiate()
```

#### Linux (systemd):
Add `replication.replSetName: "rs0"` to `/etc/mongod.conf`, restart `systemctl restart mongod`, and run `rs.initiate()`.

### Step 3.4: Start Development Servers
Run the full monorepo in parallel:
```bash
pnpm dev
```

Or start packages individually:
```bash
# Start API only
pnpm --filter @petverse/api dev

# Start Frontend only
pnpm --filter @petverse/web dev
```

---

## 4. Seeding the Database

To populate the development database with mock pets, users, clinics, vaccines, and inventory:

```bash
# Run database seed script
pnpm --filter @petverse/api run seed
```

*Note: In `NODE_ENV=production`, fake seed data scripts are permanently disabled to prevent mock record pollution.*

---

## 5. Testing & Quality Verification

PetVerse mandates strict verification before any code can be merged:

```bash
# 1. Typecheck both API and Web
pnpm --filter @petverse/api run type-check
pnpm --filter @petverse/web run type-check

# 2. Lint Web and API
pnpm --filter @petverse/web run lint

# 3. Run Backend Unit & Integration Tests
pnpm --filter @petverse/api test

# 4. Run Frontend Unit & Component Tests
pnpm --filter @petverse/web test

# 5. Build all packages for production
pnpm run build
```

---

## 6. Troubleshooting Common Issues

### Issue 1: "Transaction numbers are only allowed on a replica set member or mongos"
- **Cause**: MongoDB is running as a standalone node instead of a replica set member.
- **Fix**: Launch mongod with `--replSet rs0` and run `rs.initiate()` in `mongosh`. Alternatively, use `docker-compose.dev.yml` which configures a replica set automatically.

### Issue 2: "Redis connection error: ECONNREFUSED"
- **Cause**: Redis server is not running on port 6379.
- **Fix**: Start local Redis with `redis-server`, or run `docker run -d -p 6379:6379 redis:7-alpine`.

### Issue 3: "Insecure JWT secret in production"
- **Cause**: In `NODE_ENV=production`, secrets matching `dev_secret`, `secret`, or `change-in-production` throw startup exceptions.
- **Fix**: Provide a cryptographically random string (`openssl rand -hex 32`) for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.

### Issue 4: "CORS error on frontend requests"
- **Cause**: `CORS_ORIGIN` in `apps/api/.env` does not include your frontend origin.
- **Fix**: Add your local port to `CORS_ORIGIN=http://localhost:5173,http://localhost:3000`.
