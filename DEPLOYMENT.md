# Production Deployment — Quick-Konnect

This is the complete guide to deploying Quick-Konnect on a Linux VPS with
HTTPS, PostgreSQL, Redis, and Nginx running inside Docker.

Read it top to bottom the first time. After that, the "Updating" section
is the only thing you'll need.

---

## Architecture

\`\`\`
                    Internet
                       │
                       ▼
              ┌────────────────┐
              │   Nginx :443   │  ← SSL termination
              │   (Docker)     │
              └────────┬───────┘
                       │ proxy_pass
                       ▼
              ┌────────────────┐
              │  Next.js :3000 │  ← The app
              │   (Docker)     │
              └────────┬───────┘
                       │
              ┌────────┴────────┐
              ▼                 ▼
       ┌────────────┐    ┌────────────┐
       │ PostgreSQL │    │   Redis    │
       │  :5432     │    │   :6379    │
       └────────────┘    └────────────┘
       All on the same Docker network. Only Nginx has public ports.
\`\`\`

**What lives where:**

| Item | Storage | Backup? |
|---|---|---|
| Code | GitHub | push regularly |
| Database | Docker volume \`postgres_data\` | yes — see Backups |
| Uploaded files | Docker volume \`uploads\` | yes — see Backups |
| SSL certificates | \`nginx/certbot/conf\` on VPS | auto-renewed |
| Secrets (.env) | VPS only, never committed | keep a copy off-VPS |

---

## Prerequisites

1. **A VPS** running Ubuntu 22.04 or 24.04, minimum **2 GB RAM, 2 vCPU, 40 GB disk**.
2. **A domain** with DNS A record pointing to the VPS IP address.
3. **SSH access** as \`root\` or a sudo user.
4. **A local copy of the repo** pushed to GitHub.

---

## Step 1 — Point your domain at the VPS

In your domain registrar / Cloudflare dashboard:

| Type | Name | Value |
|---|---|---|
| A | \`@\` | \`your-vps-ip\` |
| A | \`www\` | \`your-vps-ip\` |

Wait ~5 minutes, then verify from your PC:

\`\`\`bash
dig +short your-domain.com
\`\`\`

It must return your VPS IP. Do not continue until it does.

---

## Step 2 — Connect to the VPS

\`\`\`bash
ssh root@your-vps-ip
\`\`\`

---

## Step 3 — Install Docker and Git

\`\`\`bash
# Update system
apt update && apt upgrade -y

# Install Docker (official install script)
curl -fsSL https://get.docker.com | sh

# Install Git and other utilities
apt install -y git ufw curl

# Verify
docker --version
docker compose version
\`\`\`

---

## Step 4 — Firewall

\`\`\`bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Enable
ufw --force enable

# Verify
ufw status
\`\`\`

---

## Step 5 — Clone the repository

\`\`\`bash
cd ~
git clone https://github.com/aaotech-code/quick-konnect.git
cd quick-konnect
\`\`\`

---

## Step 6 — Configure environment

\`\`\`bash
cp .env.production.example .env
nano .env
\`\`\`

Fill in every value. Generate secrets with:

\`\`\`bash
# POSTGRES_PASSWORD (32 chars)
openssl rand -base64 32 | tr -d '=+/' | cut -c1-32

# SESSION_SECRET (48 chars)
openssl rand -base64 48
\`\`\`

Save and exit (\`Ctrl+O\`, \`Enter\`, \`Ctrl+X\`).

Verify no blank critical fields:

\`\`\`bash
grep -E '^(POSTGRES_PASSWORD|SESSION_SECRET|DOMAIN|SSL_EMAIL)=' .env
\`\`\`

---

## Step 7 — Start the database

\`\`\`bash
docker compose -f docker-compose.prod.yml up -d postgres redis
docker compose -f docker-compose.prod.yml ps
\`\`\`

Both should show \`(healthy)\`. If they don't, check logs:

\`\`\`bash
docker compose -f docker-compose.prod.yml logs postgres
\`\`\`

---

## Step 8 — Run migrations and seed

\`\`\`bash
# Apply all migrations (creates all tables)
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy

# Seed roles, categories, locations, settings
docker compose -f docker-compose.prod.yml run --rm web npx prisma db seed
\`\`\`

> First run builds the \`web\` image — takes 3–5 minutes. Subsequent runs are instant.

---

## Step 9 — Create the admin user

Choose your email and a strong password — you'll use these to sign in:

\`\`\`bash
docker compose -f docker-compose.prod.yml run --rm web \
  npm run seed:admin -- your-email@example.com YourStrongPassword123
\`\`\`

**This is where the admin password is set.** It's hashed and stored in the
database. You never need to remember a "previous" password — you just set
a new one with this command.

If you forget it later, run this command again with a new password. It
will overwrite the old one and re-grant the \`admin\` role.

---

## Step 10 — Start the full stack

\`\`\`bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
\`\`\`

Verify your site is reachable over HTTP:

\`\`\`bash
curl -I http://your-domain.com
\`\`\`

You should get \`HTTP/1.1 200 OK\`.

---

## Step 11 — Enable HTTPS

\`\`\`bash
bash nginx/init-ssl.sh
\`\`\`

This:
1. Requests a certificate from Let's Encrypt
2. Rewrites the nginx config to serve HTTPS
3. Reloads nginx
4. Sets up auto-renewal (daily at 3am)

When it finishes, visit:

\`\`\`
https://your-domain.com
\`\`\`

You should see the padlock in the browser and the Quick-Konnect homepage.

---

## Step 12 — Sign in and verify

1. Open \`https://your-domain.com/login\`
2. Sign in with the admin email/password from Step 9
3. Visit \`https://your-domain.com/admin\`
4. Confirm the admin panel loads with all sections

**You're live.**

---

## Updating the app

After pushing changes to GitHub from your PC:

\`\`\`bash
cd ~/quick-konnect
git pull
docker compose -f docker-compose.prod.yml up -d --build web
\`\`\`

That rebuilds the app image and restarts only the \`web\` container. Postgres
and Redis keep running. Downtime is a few seconds.

If migrations were added:

\`\`\`bash
docker compose -f docker-compose.prod.yml run --rm web npx prisma migrate deploy
\`\`\`

---

## Backups

### Database

\`\`\`bash
# Manual backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U app trusted_services | gzip > backup-$(date +%F).sql.gz
\`\`\`

Restore:

\`\`\`bash
gunzip -c backup-2026-01-01.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U app -d trusted_services
\`\`\`

### Automated daily backups

Add to crontab (\`crontab -e\`):

\`\`\`
0 4 * * * cd ~/quick-konnect && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U app trusted_services | gzip > ~/backups/db-$(date +\%F).sql.gz
0 5 * * 0 find ~/backups -name 'db-*.sql.gz' -mtime +30 -delete
\`\`\`

Also create the backups folder: \`mkdir -p ~/backups\`.

### Uploaded files

The \`uploads\` Docker volume holds user-uploaded files. Back it up:

\`\`\`bash
docker run --rm \
  -v quick-konnect_uploads:/data \
  -v ~/backups:/backup \
  alpine tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
\`\`\`

---

## Common operations

\`\`\`bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View app logs only
docker compose -f docker-compose.prod.yml logs -f web

# Restart just the app
docker compose -f docker-compose.prod.yml restart web

# Restart everything
docker compose -f docker-compose.prod.yml restart

# Stop everything
docker compose -f docker-compose.prod.yml down

# Stop and remove all data (DESTRUCTIVE)
docker compose -f docker-compose.prod.yml down -v

# Open a shell inside the app container
docker compose -f docker-compose.prod.yml exec web sh

# Run any npm script inside the container
docker compose -f docker-compose.prod.yml exec web npm run seed:admin -- new@email.com NewPassword123
\`\`\`

---

## Troubleshooting

**Site unreachable over HTTP**
- Is Docker running? \`systemctl status docker\`
- Are containers up? \`docker compose -f docker-compose.prod.yml ps\`
- Is the firewall blocking? \`ufw status\`
- Is DNS pointing here? \`dig +short your-domain.com\`

**SSL failed**
- Did you wait for DNS? (verify with \`dig\`)
- Is port 80 open from the internet? Try \`curl -I http://your-domain.com\` from your PC.
- Try again with verbose: \`docker run --rm -it -v ... certbot/certbot certonly --webroot ...\`

**App crashes on start**
- Logs: \`docker compose -f docker-compose.prod.yml logs web\`
- Usually a missing or wrong env var. Check \`.env\`.

**Database connection errors**
- Is \`postgres\` healthy? \`docker compose -f docker-compose.prod.yml ps\`
- Is \`POSTGRES_PASSWORD\` in \`.env\` the same as what's in \`DATABASE_URL\`?
- Did you run migrations? \`... run --rm web npx prisma migrate deploy\`

**"Permission denied" on uploads**
- Volume permissions. Recreate the web container:
  \`docker compose -f docker-compose.prod.yml up -d --force-recreate web\`

---

## Security notes

- **Never commit \`.env\`.** It's in \`.gitignore\`. Keep an offline copy.
- **Rotate \`SESSION_SECRET\`** if you suspect it leaked — all sessions become invalid.
- **SSH:** disable password login once key-based auth works:
  \`\`\`bash
  nano /etc/ssh/sshd_config
  # Set: PasswordAuthentication no
  systemctl restart ssh
  \`\`\`
- **Fail2ban** (optional but recommended):
  \`\`\`bash
  apt install fail2ban -y
  \`\`\`
- **Updates:** \`apt update && apt upgrade -y\` weekly. Reboot monthly.

---

## Cost (reference)

| Item | Monthly |
|---|---|
| Hetzner CX22 VPS | ~€4.59 |
| Domain (Cloudflare) | ~$0.87 |
| Let's Encrypt SSL | Free |
| **Total** | **~$6/month** |

At scale, upgrade to a bigger VPS or move the database to a managed service.
For the first few thousand users, this single-box setup is enough.
