#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Quick-Konnect — One-time Let's Encrypt SSL setup
#
# Run this ONCE after your domain points to the VPS and
# the stack is up on HTTP.
#
# Usage:
#   cd ~/quick-konnect
#   bash nginx/init-ssl.sh
#
# Requires in .env:
#   DOMAIN=your-domain.com
#   SSL_EMAIL=you@example.com
# ═══════════════════════════════════════════════════════════════

set -e

if [ ! -f .env ]; then
  echo "Error: .env file not found in current directory"
  exit 1
fi

source .env

if [ -z "$DOMAIN" ]; then
  echo "Error: DOMAIN not set in .env"
  exit 1
fi

if [ -z "$SSL_EMAIL" ]; then
  echo "Error: SSL_EMAIL not set in .env"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Setting up SSL for: $DOMAIN"
echo "  Contact email:      $SSL_EMAIL"
echo "═══════════════════════════════════════════════════════════"
echo ""

# 1. Ensure required directories exist
mkdir -p nginx/certbot/conf nginx/certbot/www

# 2. Make sure nginx is running with the HTTP config
docker compose -f docker-compose.prod.yml up -d nginx

# 3. Get the certificate
docker run --rm \
  -v "$(pwd)/nginx/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/nginx/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$SSL_EMAIL" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" || {
    echo ""
    echo "Certificate request failed."
    echo "Common causes:"
    echo "  - DNS not pointing to this server yet (run: dig +short $DOMAIN)"
    echo "  - Port 80 not open in firewall (run: ufw status)"
    echo "  - www subdomain does not resolve"
    echo "Retry after fixing: bash nginx/init-ssl.sh"
    exit 1
  }

# 4. Write the SSL nginx config
cat > nginx/nginx.conf <<'NGINX_EOF'
upstream nextjs {
  server web:3000;
}

server {
  listen 80;
  server_name _;

  location /.well-known/acme-challenge/ {
    root /var/www/certbot;
  }

  location / {
    return 301 https://$host$request_uri;
  }
}

server {
  listen 443 ssl;
  http2 on;
  server_name _;

  ssl_certificate /etc/letsencrypt/live/__DOMAIN__/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/__DOMAIN__/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers off;

  client_max_body_size 25M;

  # Security headers (also set by Next.js)
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  location / {
    proxy_pass http://nextjs;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 90;
  }
}
NGINX_EOF

# Substitute the domain into the config
sed -i "s/__DOMAIN__/$DOMAIN/g" nginx/nginx.conf

# 5. Reload nginx
docker compose -f docker-compose.prod.yml restart nginx

# 6. Set up auto-renewal (runs daily at 3am)
RENEW_CMD="cd $(pwd) && docker run --rm -v $(pwd)/nginx/certbot/conf:/etc/letsencrypt -v $(pwd)/nginx/certbot/www:/var/www/certbot certbot/certbot renew --webroot --webroot-path=/var/www/certbot --quiet && docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload"

# Only add if not already present
( crontab -l 2>/dev/null | grep -v "quick-konnect SSL renewal" ; echo "0 3 * * * $RENEW_CMD # quick-konnect SSL renewal" ) | crontab -

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  SSL is live."
echo ""
echo "  Visit: https://$DOMAIN"
echo ""
echo "  Auto-renewal is set (daily at 3am)."
echo "═══════════════════════════════════════════════════════════"
echo ""
