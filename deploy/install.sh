#!/usr/bin/env bash
#
# Idempotent installer for the Create+ Dashboard. Run as root on the target VM:
#
#   sudo bash deploy/install.sh /path/to/real/.env
#
# Safe to re-run: every step checks current state before changing it.

set -euo pipefail

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
    echo "This script must be run as root (try: sudo bash $0 <env-file>)" >&2
    exit 1
fi

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 /path/to/real/.env" >&2
    exit 1
fi

ENV_SRC="$1"
if [[ ! -f "$ENV_SRC" ]]; then
    echo "Env file not found: $ENV_SRC" >&2
    exit 1
fi

# Resolve the repo root (this script lives in <repo>/deploy/install.sh).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INSTALL_DIR="/opt/dashboard"
SERVICE_USER="dashboard"
SERVICE_GROUP="dashboard"

echo "==> Ensuring system user/group '$SERVICE_USER' exists"
if ! getent group "$SERVICE_GROUP" >/dev/null 2>&1; then
    groupadd --system "$SERVICE_GROUP"
fi
if ! id "$SERVICE_USER" >/dev/null 2>&1; then
    useradd --system --gid "$SERVICE_GROUP" --home-dir "$INSTALL_DIR" \
        --no-create-home --shell /usr/sbin/nologin "$SERVICE_USER"
fi

echo "==> Ensuring $INSTALL_DIR exists"
mkdir -p "$INSTALL_DIR"

echo "==> Copying backend/ and frontend/ into $INSTALL_DIR"
if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete --exclude 'tests/' --exclude '__pycache__/' --exclude '*.pyc' \
        "$REPO_ROOT/backend/" "$INSTALL_DIR/backend/"
    rsync -a --delete --exclude 'tests/' --exclude 'node_modules/' \
        "$REPO_ROOT/frontend/" "$INSTALL_DIR/frontend/"
else
    rm -rf "$INSTALL_DIR/backend" "$INSTALL_DIR/frontend"
    mkdir -p "$INSTALL_DIR/backend" "$INSTALL_DIR/frontend"
    cp -r "$REPO_ROOT/backend/." "$INSTALL_DIR/backend/"
    cp -r "$REPO_ROOT/frontend/." "$INSTALL_DIR/frontend/"
    rm -rf "$INSTALL_DIR/backend/tests" "$INSTALL_DIR/frontend/tests"
fi

echo "==> Creating/updating venv at $INSTALL_DIR/venv"
if [[ ! -x "$INSTALL_DIR/venv/bin/python" ]]; then
    python3 -m venv "$INSTALL_DIR/venv"
fi
"$INSTALL_DIR/venv/bin/pip" install --upgrade pip
"$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/backend/requirements.txt"

echo "==> Installing .env from $ENV_SRC"
cp "$ENV_SRC" "$INSTALL_DIR/.env"
chmod 600 "$INSTALL_DIR/.env"
chown "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_DIR/.env"

echo "==> Owning $INSTALL_DIR by $SERVICE_USER:$SERVICE_GROUP"
chown -R "$SERVICE_USER:$SERVICE_GROUP" "$INSTALL_DIR"

echo "==> Installing sudoers rule (validated before activation)"
SUDOERS_TMP="$(mktemp)"
cp "$REPO_ROOT/deploy/dashboard-sudoers" "$SUDOERS_TMP"
if ! visudo -cf "$SUDOERS_TMP"; then
    echo "ERROR: deploy/dashboard-sudoers failed visudo validation; aborting without installing it." >&2
    rm -f "$SUDOERS_TMP"
    exit 1
fi
install -m 440 -o root -g root "$SUDOERS_TMP" /etc/sudoers.d/dashboard
rm -f "$SUDOERS_TMP"

echo "==> Installing systemd unit"
cp "$REPO_ROOT/deploy/dashboard.service" /etc/systemd/system/dashboard.service
systemctl daemon-reload
systemctl enable --now dashboard
# enable --now is a no-op if the unit is already running, so restart explicitly
# to make sure re-runs (redeploys) actually pick up the new code.
systemctl restart dashboard

echo "==> Ensuring Caddy is installed"
if ! command -v caddy >/dev/null 2>&1; then
    apt-get update
    apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
        | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
        > /etc/apt/sources.list.d/caddy-stable.list
    apt-get update
    apt-get install -y caddy
fi

echo "==> Installing Caddyfile"
cp "$REPO_ROOT/deploy/Caddyfile" /etc/caddy/Caddyfile
if systemctl is-active --quiet caddy; then
    systemctl reload caddy
else
    systemctl enable --now caddy
fi

echo "==> Done."
