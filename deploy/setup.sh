#!/usr/bin/env bash
# CPFA — production setup (run with sudo).
# Idempotent: safe to re-run after DNS changes or to renew certs.

set -euo pipefail

DOMAIN="cpfa-sn.com"
WWW_DOMAIN="www.cpfa-sn.com"
LE_EMAIL="ydiop@5sursync.com"
DEPLOY_DIR="/opt/cpfa/deploy"
NGINX_AVAIL="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"
SYSTEMD_UNIT="/etc/systemd/system/cpfa.service"
EXPECTED_IP="161.97.105.26"

if [[ $EUID -ne 0 ]]; then
  echo "ERROR: this script must run as root (use sudo)." >&2
  exit 1
fi

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok()   { printf '  \033[0;32m✓\033[0m %s\n' "$*"; }
warn() { printf '  \033[0;33m!\033[0m %s\n' "$*"; }
die()  { printf '\n\033[0;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ── 1. DNS sanity check ────────────────────────────────────────────────
step "Checking DNS for ${DOMAIN}"
RESOLVED="$(dig +short A "${DOMAIN}" @1.1.1.1 | tail -n1 || true)"
if [[ "${RESOLVED}" != "${EXPECTED_IP}" ]]; then
  die "DNS for ${DOMAIN} returns '${RESOLVED}', expected '${EXPECTED_IP}'.
       Update the A record at your registrar and wait for propagation, then re-run."
fi
ok "${DOMAIN} → ${EXPECTED_IP}"

WWW_RESOLVED="$(dig +short A "${WWW_DOMAIN}" @1.1.1.1 | tail -n1 || true)"
if [[ "${WWW_RESOLVED}" != "${EXPECTED_IP}" ]]; then
  warn "${WWW_DOMAIN} resolves to '${WWW_RESOLVED}' (expected '${EXPECTED_IP}'). Cert will skip www if it can't validate."
fi

# ── 2. Install certbot if missing ──────────────────────────────────────
step "Ensuring certbot + nginx plugin are installed"
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y certbot python3-certbot-nginx
  ok "certbot installed"
else
  ok "certbot already present ($(certbot --version 2>&1))"
fi

# ── 3. Install nginx vhost (HTTP only — certbot will add TLS) ──────────
step "Installing nginx vhost ${DOMAIN}"
install -m 0644 "${DEPLOY_DIR}/nginx-cpfa-sn.com.conf" "${NGINX_AVAIL}"
ln -sf "${NGINX_AVAIL}" "${NGINX_ENABLED}"
nginx -t
systemctl reload nginx
ok "nginx vhost active (HTTP)"

# ── 4. Obtain TLS cert via certbot --nginx ─────────────────────────────
step "Requesting Let's Encrypt cert for ${DOMAIN}${WWW_RESOLVED:+ + ${WWW_DOMAIN}}"
CERTBOT_DOMAINS=("-d" "${DOMAIN}")
if [[ "${WWW_RESOLVED}" == "${EXPECTED_IP}" ]]; then
  CERTBOT_DOMAINS+=("-d" "${WWW_DOMAIN}")
fi
certbot --nginx "${CERTBOT_DOMAINS[@]}" \
        -m "${LE_EMAIL}" --agree-tos --no-eff-email \
        --redirect -n
ok "TLS active (auto-renew via systemd timer 'certbot.timer')"

# ── 5. Install + enable cpfa.service ───────────────────────────────────
step "Installing cpfa.service"
install -m 0644 "${DEPLOY_DIR}/cpfa.service" "${SYSTEMD_UNIT}"
systemctl daemon-reload
systemctl enable cpfa.service
ok "cpfa.service installed and enabled at boot"

# ── 6. Firewall (only if ufw is active) ────────────────────────────────
step "Firewall (ufw)"
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp  comment 'http (cpfa + premiumconnect)' || true
  ufw allow 443/tcp comment 'https (cpfa)' || true
  ok "ufw rules ensured"
else
  warn "ufw not active — skipping. Open 80/443 at the cloud provider firewall if needed."
fi

# ── 7. Make sure docker daemon starts at boot ──────────────────────────
step "Ensuring docker.service is enabled"
systemctl enable docker.service >/dev/null 2>&1 || true
ok "docker.service enabled"

echo
echo "──────────────────────────────────────────────────────────────"
echo "  CPFA prod setup complete."
echo "  Next:  sudo systemctl start cpfa     (or: reboot)"
echo "         curl -I https://${DOMAIN}/"
echo "──────────────────────────────────────────────────────────────"
