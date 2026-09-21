# Quick-Konnect

**Trusted marketplace for local services in Nigeria.**

Quick-Konnect connects customers who need services (plumbing, welding, web design, catering, and 40+ other categories) with verified local providers. It handles the full transaction loop: post a job, receive quotes, hire, track, complete, review, and build reputation.

Unlike classifieds, the platform is built around **trust**: multi-step provider verification, reviews only from completed jobs, in-app messaging with photo/voice/PDF attachments, dispute resolution, and optional protected payment (designed, ships later).

---

## Stack

| Layer | Technology |
|-------|-----------|
| Web app | Next.js 16 (App Router, Server Actions, RSC) |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Cache / Queue | Redis 7 |
| Styling | Tailwind CSS |
| Auth | Server-side sessions (Argon2id hashes) |
| Email | Resend (optional; dev logs to console) |
| Payments | Paystack (planned, M9) |
| Container | Docker + Docker Compose |

---

## Prerequisites

- **Node.js** 20+ (tested on 22 and 24)
- **Docker Desktop** (or Docker Engine on Linux) — required for local PostgreSQL and Redis
- **Git**
- **Windows users:** WSL2 must be installed and enabled. Run `wsl --update && wsl --shutdown` if Docker Desktop complains.

---

## Local Setup

### 1. Clone the repo

```bash
git clone <your-repo-url> trusted-services
cd trusted-services
```

### 2. Install dependencies

```bash
npm install
```

The `postinstall` script automatically runs `prisma generate`.

### 3. Configure environment

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

- `SESSION_SECRET` — generate with:
  ```bash
  # PowerShell:
  [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
  # macOS/Linux:
  openssl rand -base64 48
  ```
- `DATABASE_URL` — defaults to the Docker Postgres below.

`RESEND_API_KEY` can stay empty during development. Emails print to the terminal.

### 4. Start PostgreSQL and Redis

```bash
docker compose up -d
docker compose ps
```

Both services should show `(healthy)`.

### 5. Run migrations and seed

```bash
npx prisma migrate deploy
npx prisma db seed
```

Seeds: 6 roles, ~43 service categories, Nigerian locations, 4 platform settings (`protected_payment_enabled = false`).

### 6. Create your admin user

```bash
npm run seed:admin -- you@example.com YourStrongPassword123
```

Creates (or promotes) an account with the `admin` role.

### 7. Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>. Sign in with your admin credentials and visit <http://localhost:3000/admin>.

---


## Production Deployment

See [\`DEPLOYMENT.md\`](./DEPLOYMENT.md) for the full guide to deploying on a VPS with Docker, Nginx, and HTTPS.

Quick summary:
\`\`\`bash
# On the VPS
git clone https://github.com/aaotech-code/quick-konnect.git
cd quick-konnect
cp .env.production.example .env
nano .env   # fill in secrets
docker compose -f docker-compose.prod.yml up -d postgres redis
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
docker compose -f docker-compose.prod.yml run --rm web npx prisma db seed
docker compose -f docker-compose.prod.yml run --rm web npm run seed:admin -- you@example.com StrongPassword123
docker compose -f docker-compose.prod.yml up -d
bash nginx/init-ssl.sh
\`\`\`

---

## Environment Variables

See `.env.example` for the full list with comments. Summary:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `SESSION_SECRET` | Yes | 32+ character random string |
| `APP_URL` | No | Base URL for email links (defaults to `http://localhost:3000`) |
| `RESEND_API_KEY` | No | Empty = log emails to console |
| `EMAIL_FROM` | No | From address for outbound emails |
| `PAYSTACK_*` | No | Reserved for M9 (protected payment) |
| `R2_*` | No | Reserved for M6 (file storage) |

> **Protected Payment is controlled by a database setting, not an environment variable.** The CI workflow fails the build if anyone tries to reintroduce an env-var override.

---

## npm Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Prisma generate + Next.js production build |
| `npm start` | Serve production build |
| `npm run typecheck` | TypeScript check, no emit |
| `npm run lint` | ESLint |
| `npm run seed:admin -- <email> <password>` | Create or promote an admin |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:deploy` | `prisma migrate deploy` (production) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:reset` | Wipe DB, re-migrate, re-seed |
| `npm run db:seed` | Run seed only |

---

## Project Structure

```
src/
├── app/                    Next.js App Router
│   ├── (auth)/             login, register, forgot/reset password
│   ├── dashboard/          customer dashboard, requests, jobs
│   ├── pro/                provider dashboard, onboarding, portfolio
│   ├── admin/              staff panel (role-gated)
│   ├── api/                route handlers (webhooks, uploads)
│   ├── jobs/[ref]/         shared job page
│   ├── messages/           inbox and thread view
│   ├── services/           public category browse
│   ├── providers/          public provider listing
│   ├── provider/[slug]/    public provider profile
│   └── legal/              terms, privacy, disputes
├── components/marketplace/  Navbar, Footer, ProviderCard, etc.
├── lib/                    shared utilities
└── server/
    ├── auth/               session, password, rbac, guards, errors
    ├── db/                 Prisma client singleton
    ├── services/           business logic (one file per domain)
    ├── integrations/       Paystack, R2, email wrappers
    └── audit.ts            audit logging helpers

prisma/
├── schema.prisma           40+ tables
├── migrations/             SQL migration history
└── seed/                   roles, categories, locations, settings

scripts/
└── seed-admin.ts           admin user creation

docker-compose.yml          Local Postgres + Redis
.github/workflows/ci.yml    Lint, typecheck, build, guardrails
```

**Business logic lives in `src/server/services/`.** Route handlers and server actions call into it; they never touch the database directly. This keeps authorization and audit logging centralized.

---

## Database

PostgreSQL 16 in Docker. Dev database name: `trusted_services`.

```bash
# Open psql
docker compose exec postgres psql -U app -d trusted_services

# Reset (drops everything, re-migrates, re-seeds)
npm run prisma:reset

# Browse data
npm run prisma:studio
```

### Migration workflow

```bash
# 1. Edit prisma/schema.prisma
# 2. Create + apply migration (stop dev server first — it locks the Prisma engine binary)
npx prisma migrate dev --name descriptive_name
# 3. If the engine was locked:
npx prisma generate
```

---

## Email

Handled by `src/server/services/email.ts`. Provider-agnostic.

- **Development:** If `RESEND_API_KEY` is empty, emails print to the server console. Copy reset links directly from the terminal.
- **Production:** Set `RESEND_API_KEY`. Emails send for real via Resend.

To enable real sending:
1. Sign up at <https://resend.com> (free — 3,000 emails/month)
2. Verify your sending domain
3. Copy API key to `.env`
4. Set `EMAIL_FROM`

---

## Security

- **Passwords:** Argon2id, OWASP 2023 parameters
- **Sessions:** Server-side rows in Postgres, httpOnly cookies, revocable on ban/password reset
- **RBAC:** Centralized permission map in `src/server/auth/rbac.ts`. `payments.manage` and `chat.read_all` are admin-only.
- **File uploads:** Magic-byte validation (image/PDF/audio), size limits, per-user folder isolation
- **Audit logging:** Every sensitive action writes to `audit_logs` (append-only, DB trigger enforced)
- **CSRF:** SameSite=Lax cookies + origin checks
- **Protected Payment:** DB setting only. CI enforces this.

Do not commit `.env`. It is in `.gitignore`.

---

## What's Not Built Yet

| Feature | Status |
|---------|--------|
| Core marketplace loop | ✅ Working |
| Auth, profiles, verification | ✅ Working |
| Messaging (text + photo + voice + PDF) | ✅ Working |
| Notifications (in-app + browser + sound) | ✅ Working |
| Disputes | ✅ Working |
| Admin panel (all sections) | ✅ Working |
| Role system (admin/manager/support/finance) | ✅ Working |
| **Protected Payment (Paystack)** | Designed; ships in M9 |
| **Email verification for new accounts** | Pending |
| **Real-device mobile testing** | Pending deployment |
| **Automated tests** | Pending |
| **Production deployment** | Pending |

The payment toggle (`protected_payment_enabled`) is seeded as `false`. Turning it on later requires admin dashboard access only — no code changes, no redeploy.

---

## License

Proprietary. All rights reserved. See `LICENSE`.

---

## Support

For bugs or questions: support@quick-konnect.com
