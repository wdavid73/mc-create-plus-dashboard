# Create+ Dashboard

A small admin dashboard for a self-hosted Minecraft (Create+) server: live status, start/stop/restart, backups, CPU/RAM metrics, connected players, and a live log — all behind a single-admin login.

## Stack

- **Backend:** FastAPI (Python), session auth (bcrypt + signed cookie), `psutil` for metrics, RCON for player/chat data, `journalctl` for live logs.
- **Frontend:** plain HTML/CSS/JS (no framework), Chart.js for the usage graphs.
- **Infra:** Caddy (automatic HTTPS), systemd, a scoped `sudoers` rule (no blanket sudo), deployed via GitHub Actions on every push to `main`.

## Status

Deployed and running. A handful of roadmap items (chat, raw console, kick/ban, whitelist, mod management, notifications, audit log) are visible in the UI as "Próximamente" placeholders — not implemented yet.

## Local development

```bash
cd backend
python -m venv venv
venv/bin/pip install -r requirements.txt
cp .env.example .env   # fill in ADMIN_USERNAME, ADMIN_PASSWORD_HASH, SESSION_SECRET_KEY
venv/bin/uvicorn app.main:app --reload
```

Run tests: `pytest backend/tests/ -v`

## Deployment

See `deploy/install.sh` and `.github/workflows/deploy.yml` — every push to `main` re-deploys to the configured host automatically.
