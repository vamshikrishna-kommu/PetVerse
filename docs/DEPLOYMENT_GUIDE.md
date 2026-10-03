# PetVerse — Production Deployment Guide

This guide covers deployment options, environment preparation, container orchestration, SSL termination, and continuous delivery for PetVerse.

---

## 1. Architecture Overview

PetVerse is designed for containerized or hybrid cloud deployment:
- **Web Client**: Static Single-Page Application (SPA) served via **Nginx** (containerized) or **Vercel / Cloudflare Pages**.
- **API Server**: Node.js 20+ Express modular backend service running in an isolated Docker container with non-root security.
- **Database**: MongoDB 7.0+ (replica set mode enabled for multi-document ACID transactions).
- **Cache & Queue**: Redis 7.2-alpine for notification queuing, caching, and rate-limiting.

---

## 2. Production Environment Variables

Before deploying, generate high-entropy cryptographic secrets:

```bash
# Generate 48-byte cryptographic keys
openssl rand -base64 48 # Copy to JWT_SECRET
openssl rand -base64 48 # Copy to JWT_REFRESH_SECRET
```

### Required Production Secrets
```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://petverse.app
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/petverse?retryWrites=true&w=majority
JWT_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
SENDGRID_API_KEY=SG.your-key
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-key
GEMINI_API_KEY=your-gemini-key
```

> **Security Rule**: Never commit `.env` to git. All CI/CD systems inject secrets via encrypted environment variables or Secret Managers (AWS Secrets Manager / GCP Secret Manager / Vault).

---

## 3. Docker Compose Production Deployment

The root `docker-compose.yml` provides a production-ready stack with MongoDB replica-set initialization, Redis, Node.js API, and Nginx Web proxy.

### Step 1: Deploy Stack
```bash
# Clone repository
git clone https://github.com/your-org/petverse.git
cd petverse

# Create production .env
cp .env.example .env
nano .env # Set production keys

# Build and start services in detached mode
docker compose up -d --build
```

### Step 2: Verify Health
```bash
# Check container status
docker compose ps

# Verify API health
curl -f http://localhost:3000/health

# Verify Dependency readiness
curl -f http://localhost:3000/ready
```

---

## 4. Frontend Deployment (Vercel)

The web client (`apps/web`) is pre-configured with `vercel.json` for edge hosting:

1. **Connect GitHub Repository** to Vercel.
2. Set **Root Directory** to `apps/web`.
3. Set **Framework Preset** to `Vite`.
4. Configure Environment Variables in Vercel Project Settings:
   - `VITE_API_BASE_URL`: `https://api.petverse.app/api/v1`
   - `VITE_GOOGLE_CLIENT_ID`: `<google-client-id>`
   - `VITE_STRIPE_PUBLISHABLE_KEY`: `pk_live_<stripe-key>`
   - `VITE_GOOGLE_MAPS_API_KEY`: `<maps-api-key>`
5. Click **Deploy**. Vercel will build with `pnpm run build` and route all traffic with SPA fallback and security headers.

---

## 5. Reverse Proxy & SSL Termination (Nginx & Certbot)

For standalone VPS / Dedicated server deployments:

```nginx
# /etc/nginx/sites-available/petverse.conf
server {
    server_name api.petverse.app;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Obtain free automated Let's Encrypt TLS certificate:
```bash
certbot --nginx -d api.petverse.app -d petverse.app
```

---

## 6. Zero-Downtime Rolling Updates

When rolling out updates using Docker Compose:
```bash
# Pull latest code
git pull origin main

# Rebuild images without bringing down running services
docker compose build --no-cache api web

# Rolling replacement
docker compose up -d --no-deps api
docker compose up -d --no-deps web

# Clean dangling images
docker image prune -f
```
