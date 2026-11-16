# Create+ Dashboard Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the FastAPI backend that gives the already-built frontend (`frontend/index.html`, `frontend/login.html`) real data and real control over the Create+ Minecraft server, running on the same Oracle Cloud VM.

**Architecture:** A single FastAPI app serves the static frontend and a JSON/WebSocket API. It authenticates via a signed session cookie (one admin user, bcrypt password), executes server control through the existing `mc-ctl` CLI (from the sibling infra repo) via a tightly scoped `sudoers` rule, samples CPU/RAM with `psutil` into an in-memory ring buffer, and reads players/log via the existing RCON client and `journalctl`. Caddy fronts it with automatic HTTPS on `163-192-138-1.nip.io`; systemd keeps it running; GitHub Actions deploys on push to `main`.

**Tech Stack:** Python 3.12, FastAPI, Uvicorn, `psutil`, `bcrypt`, `itsdangerous` (signed cookies), pytest + `fastapi.testclient.TestClient`, Caddy, systemd, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-15-dashboard-design.md`

## Global Constraints

- Backend + Caddy must stay light (~150-250MB RAM) — the VM's JVM can use up to 18GB of its ~19GB total.
- The backend process runs as its own unprivileged system user (`dashboard`), never as `mcserver` or root.
- Its only elevated access is a `sudoers.d` rule scoped to exactly: `systemctl {start,stop,restart,status} mc-create-plus` and `journalctl -u mc-create-plus *`. No blanket sudo.
- No secret (admin password, its hash, `SESSION_SECRET_KEY`, RCON password) is ever committed to the (public) repo — all come from an `.env` file on the VM, outside git.
- HTTPS via Caddy on `163-192-138-1.nip.io` (the VM's reserved public IP).
- One admin user only; session cookie is httponly + secure + signed, no tokens in localStorage.
- Login lockout: 5 failed attempts per IP → 15 minute lock (in-memory, v1).
- Metrics: sample VM-wide and the Minecraft Java process's CPU/RAM every ~10s; keep roughly the last 1-2 hours in memory; lost on backend restart (documented v1 limitation).
- The 7 "Próximamente" UI affordances (chat, raw console, kick/ban, backups history, whitelist, server.properties editor, mods, notifications, audit log) stay disabled — this plan does not implement them.

## Review Focus

- A crafted `action` value in `POST /api/control/{action}` reaching the shell as anything other than one of the six whitelisted subcommands — Task 3's test posts `../../etc/passwd` and a shell-metacharacter string and asserts `subprocess` was never invoked and the response is 400.
- The session cookie missing `HttpOnly`/`Secure`/`SameSite` or carrying no expiry, letting it leak via XSS or linger forever — Task 2's test inspects the `Set-Cookie` header's attributes directly.
- Any error response (bad login, RCON failure, subprocess failure) echoing the admin password hash, `SESSION_SECRET_KEY`, or the RCON password back to the client — Task 2 and Task 5's tests assert those strings are absent from every response body, including 500s.
- The metrics background task dying silently (e.g. the Java process isn't found, or `psutil` raises) and freezing the charts forever with no indication — Task 4's test kills/omits the target process and asserts the sampler keeps running and records zeros rather than crashing the loop.
- The login lockout counter being per-process memory, so restarting the service resets it — not fixable without persistence in v1; Task 2 documents this explicitly in a code comment and the task's ledger note rather than leaving it silently absent.

---

## Task 1: Backend skeleton, health check, static frontend

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Test: `backend/tests/test_health.py`

**Interfaces:**
- Produces: `app` (FastAPI instance) importable from `backend.app.main`, used by every later task's router (`app.include_router(...)`) and by `TestClient(app)` in every test file.

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/test_health.py
from fastapi.testclient import TestClient
from backend.app.main import app

def test_health():
    client = TestClient(app)
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_health.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'backend.app.main'`

- [ ] **Step 3: Implement the skeleton**

`backend/app/main.py`: create `app = FastAPI()`, a `GET /api/health` route returning `{"status": "ok"}`, and `app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")` mounted **last** (after all `/api` routers from later tasks, so it never shadows them). `backend/requirements.txt`: `fastapi`, `uvicorn[standard]`, `psutil`, `bcrypt`, `itsdangerous`, `pytest`, `httpx` (TestClient dependency). `backend/.env.example`: `ADMIN_USERNAME=`, `ADMIN_PASSWORD_HASH=`, `SESSION_SECRET_KEY=`, `MC_SERVICE_NAME=mc-create-plus`, `MC_CTL_PATH=/usr/local/bin/mc-ctl`, `MC_SERVER_PROPERTIES=/opt/mc-server/server.properties`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_health.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/__init__.py backend/app/main.py backend/requirements.txt backend/.env.example backend/tests/test_health.py
git commit -m "feat: FastAPI skeleton with health check and static frontend mount"
```

---

## Task 2: Session auth (login, logout, lockout)

**Files:**
- Create: `backend/app/auth.py`
- Modify: `backend/app/main.py` (mount `auth.router`)
- Test: `backend/tests/test_auth.py`

**Interfaces:**
- Consumes: `app` from Task 1.
- Produces: `require_session(request: Request) -> str` (FastAPI dependency, returns the username or raises `HTTPException(401)`) — every later protected router (Tasks 3, 4, 5) depends on this exact function from `backend.app.auth`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_auth.py
import bcrypt
from fastapi.testclient import TestClient
from backend.app.main import app

def _client(monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "admin")
    monkeypatch.setenv("ADMIN_PASSWORD_HASH", bcrypt.hashpw(b"correct-horse", bcrypt.gensalt()).decode())
    monkeypatch.setenv("SESSION_SECRET_KEY", "test-secret")
    return TestClient(app)

def test_login_success_sets_secure_session_cookie(monkeypatch):
    client = _client(monkeypatch)
    resp = client.post("/api/login", json={"username": "admin", "password": "correct-horse"})
    assert resp.status_code == 200
    cookie_header = resp.headers["set-cookie"]
    assert "HttpOnly" in cookie_header
    assert "Secure" in cookie_header
    assert "SameSite=strict" in cookie_header.lower().replace(" ", "").replace("samesite=strict", "SameSite=strict")

def test_login_wrong_password_rejected_and_no_secrets_leaked(monkeypatch):
    client = _client(monkeypatch)
    resp = client.post("/api/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401
    assert "correct-horse" not in resp.text
    assert "test-secret" not in resp.text

def test_sixth_failed_attempt_in_window_is_locked_out(monkeypatch):
    client = _client(monkeypatch)
    for _ in range(5):
        client.post("/api/login", json={"username": "admin", "password": "wrong"})
    resp = client.post("/api/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 429
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/test_auth.py -v`
Expected: FAIL (no `/api/login` route yet)

- [ ] **Step 3: Implement `backend/app/auth.py`**

`router = APIRouter()`. `POST /api/login` body `{username: str, password: str}`: track failed attempts per client IP in a `dict[str, list[float]]` (timestamps), pruning entries older than 15 minutes; if 5+ remain, return 429 before checking credentials. Otherwise compare `username` to `ADMIN_USERNAME` and `bcrypt.checkpw` against `ADMIN_PASSWORD_HASH`; on success, sign `{"user": username}` with `itsdangerous.URLSafeTimedSerializer(SESSION_SECRET_KEY)` and set it as cookie `session`, `httponly=True, secure=True, samesite="strict", max_age=86400`; on failure, record the attempt and return 401. `POST /api/logout` deletes the cookie. `require_session(request: Request) -> str` reads the `session` cookie, verifies it with the same serializer (`max_age=86400`), returns `payload["user"]` or raises `HTTPException(401)`. Document the in-memory-only lockout limitation in a comment above the attempts dict (Review Focus item 5).

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/test_auth.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/auth.py backend/app/main.py backend/tests/test_auth.py
git commit -m "feat: session login/logout with bcrypt and lockout"
```

---

## Task 3: Server control endpoints

**Files:**
- Create: `backend/app/control.py`
- Modify: `backend/app/main.py` (mount `control.router`)
- Test: `backend/tests/test_control.py`

**Interfaces:**
- Consumes: `require_session` from Task 2.
- Produces: `ACTIONS: dict[str, list[str]]` (the action whitelist) in `backend.app.control`, read by Task 6's frontend-contract expectations (the six action names: `start`, `stop`, `restart`, `backup-now`, `backup-offsite`, `schedule-on`, `schedule-off`) and by Task 9's end-to-end check.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_control.py
from unittest.mock import patch
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.tests.conftest import authed_client  # fixture: logged-in TestClient, see Task 2 pattern

def test_valid_action_invokes_whitelisted_subprocess_call(authed_client):
    with patch("backend.app.control.subprocess.run") as mock_run:
        mock_run.return_value.returncode = 0
        mock_run.return_value.stdout = "ok"
        resp = authed_client.post("/api/control/start")
    assert resp.status_code == 200
    mock_run.assert_called_once()
    args = mock_run.call_args[0][0]
    assert args == ["sudo", "/usr/local/bin/mc-ctl", "start"]

def test_path_traversal_action_rejected_without_invoking_subprocess(authed_client):
    with patch("backend.app.control.subprocess.run") as mock_run:
        resp = authed_client.post("/api/control/../../etc/passwd")
    assert resp.status_code in (400, 404)
    mock_run.assert_not_called()

def test_shell_metacharacter_action_rejected(authed_client):
    with patch("backend.app.control.subprocess.run") as mock_run:
        resp = authed_client.post("/api/control/start;rm -rf /")
    assert resp.status_code == 400
    mock_run.assert_not_called()

def test_unauthenticated_request_rejected(client):  # fixture: plain TestClient, no login
    resp = client.post("/api/control/start")
    assert resp.status_code == 401
```

Add the `client` and `authed_client` fixtures to `backend/tests/conftest.py`, reusing Task 2's `_client`-style env setup and performing the login POST for `authed_client`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/test_control.py -v`
Expected: FAIL (no `/api/control/*` route yet)

- [ ] **Step 3: Implement `backend/app/control.py`**

`ACTIONS = {"start": ["start"], "stop": ["stop"], "restart": ["restart"], "backup-now": ["backup-now"], "backup-offsite": ["backup-offsite"], "schedule-on": ["schedule-on"], "schedule-off": ["schedule-off"]}`. `POST /api/control/{action}` (path param typed `str`, depends on `require_session`): look up `action` in `ACTIONS`; if absent, `raise HTTPException(400, "unknown action")`; otherwise run `subprocess.run(["sudo", os.environ["MC_CTL_PATH"]] + ACTIONS[action], capture_output=True, text=True, timeout=30)` (never `shell=True`) and return `{"ok": result.returncode == 0, "output": result.stdout + result.stderr}`. `GET /api/status` (also behind `require_session`): `subprocess.run(["systemctl", "is-active", os.environ["MC_SERVICE_NAME"]], capture_output=True, text=True)`, return `{"status": result.stdout.strip()}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/test_control.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/control.py backend/app/main.py backend/tests/test_control.py backend/tests/conftest.py
git commit -m "feat: whitelisted server control endpoints"
```

---

## Task 4: Metrics sampler and endpoint

**Files:**
- Create: `backend/app/metrics.py`
- Modify: `backend/app/main.py` (start the sampler on startup, mount `metrics.router`)
- Test: `backend/tests/test_metrics.py`

**Interfaces:**
- Consumes: `require_session` from Task 2.
- Produces: `MetricsBuffer` class with `.append(cpu_pct: float, ram_vm_gb: float, ram_java_gb: float) -> None` and `.snapshot() -> dict` (keys `labels`, `cpu`, `ram_vm_gb`, `ram_java_gb`, each a `list`), used by Task 9's end-to-end check of `/api/metrics`.

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_metrics.py
from backend.app.metrics import MetricsBuffer, sample_once

def test_buffer_snapshot_shapes_match():
    buf = MetricsBuffer(maxlen=5)
    for i in range(7):
        buf.append(cpu_pct=i, ram_vm_gb=5.0, ram_java_gb=4.0)
    snap = buf.snapshot()
    assert len(snap["cpu"]) == 5
    assert len(snap["labels"]) == len(snap["cpu"]) == len(snap["ram_vm_gb"]) == len(snap["ram_java_gb"])

def test_sample_once_returns_zero_java_ram_when_process_not_found(monkeypatch):
    import backend.app.metrics as m
    monkeypatch.setattr(m, "_find_java_process", lambda: None)
    cpu, ram_vm, ram_java = sample_once()
    assert ram_java == 0.0
    assert isinstance(cpu, float) and isinstance(ram_vm, float)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/test_metrics.py -v`
Expected: FAIL (module doesn't exist)

- [ ] **Step 3: Implement `backend/app/metrics.py`**

`MetricsBuffer(maxlen: int = 720)` wraps three `collections.deque(maxlen=maxlen)` (cpu, ram_vm_gb, ram_java_gb) plus a labels deque of `datetime.now().isoformat()` per `append()` call; `snapshot()` returns `{"labels": list(...), "cpu": list(...), "ram_vm_gb": list(...), "ram_java_gb": list(...)}`. `_find_java_process()` iterates `psutil.process_iter(["name", "cmdline"])` for one whose cmdline contains `"unix_args.txt"` (the Forge launch argument already used in the service's `ExecStart`), returning the `psutil.Process` or `None`. `sample_once() -> tuple[float, float, float]` returns `(psutil.cpu_percent(interval=None), psutil.virtual_memory().used / 1e9, 0.0 if no process else process.memory_info().rss / 1e9)`, catching `psutil.Error` around the process read and treating it as not-found (Review Focus item 4). On FastAPI startup, launch an `asyncio` background task that calls `sample_once()` and `buffer.append(...)` every 10 seconds in a `while True` wrapped in `try/except Exception: pass` so one bad sample never kills the loop. `GET /api/metrics` (behind `require_session`) returns `buffer.snapshot()`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/test_metrics.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/metrics.py backend/app/main.py backend/tests/test_metrics.py
git commit -m "feat: CPU/RAM metrics sampler and endpoint"
```

---

## Task 5: Players and live log

**Files:**
- Create: `backend/app/game.py`
- Create: `backend/app/rcon.py`
- Modify: `backend/app/main.py` (mount `game.router`)
- Test: `backend/tests/test_game.py`

**Interfaces:**
- Consumes: `require_session` from Task 2.
- Produces: `parse_player_list(raw: str) -> dict` (`{"online": int, "max": int, "players": list[str]}`), used by Task 9's end-to-end check. `send_rcon_command(command: str) -> str`, reused by any later "Próximamente" feature once it's actually implemented (not this plan).

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_game.py
from backend.app.game import parse_player_list

def test_parse_player_list_with_players():
    raw = "There are 2 of a max of 8 players online: Guicho, Amigo1"
    assert parse_player_list(raw) == {"online": 2, "max": 8, "players": ["Guicho", "Amigo1"]}

def test_parse_player_list_empty():
    raw = "There are 0 of a max of 8 players online:"
    assert parse_player_list(raw) == {"online": 0, "max": 8, "players": []}
```

```python
# backend/tests/test_auth.py (addition)
def test_players_endpoint_error_never_leaks_rcon_password(monkeypatch, authed_client):
    monkeypatch.setenv("MC_SERVER_PROPERTIES", "/nonexistent/server.properties")
    resp = authed_client.get("/api/players")
    assert resp.status_code >= 400
    assert "rcon.password" not in resp.text
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/test_game.py -v`
Expected: FAIL (module doesn't exist)

- [ ] **Step 3: Implement `backend/app/rcon.py` and `backend/app/game.py`**

`backend/app/rcon.py`: port the Source RCON client from `D:\Minecraft Server\scripts\mc-rcon.py` (same `send_packet`/`recv_packet` logic) into a `send_rcon_command(command: str) -> str` function that reads `rcon.port`/`rcon.password` from the file at `os.environ["MC_SERVER_PROPERTIES"]` (raising a generic `RuntimeError("rcon unavailable")` on any file or socket error — never let the raw exception, which could contain the password from a path string, reach the client). `backend/app/game.py`: `parse_player_list(raw: str) -> dict` parses the `list` command's "There are N of a max of M players online: a, b" response via a regex, splitting the trailing player names on `", "` and filtering empty strings. `GET /api/players` (behind `require_session`) calls `send_rcon_command("list")`, parses it, returns the dict; on `RuntimeError`, returns a 503 with a generic message (Review Focus item 3). `GET /api/logs/recent` runs `subprocess.run(["journalctl", "-u", os.environ["MC_SERVICE_NAME"], "-n", "50", "--no-pager", "-o", "cat"], capture_output=True, text=True)` and returns `{"lines": result.stdout.splitlines()}`. `GET /ws/logs` (WebSocket, behind the same session check performed manually since WebSocket routes don't support `Depends` the same way — verify the `session` cookie in the handshake before accepting) opens a subprocess `journalctl -u <service> -f -o cat` and forwards each new stdout line to the socket until it closes.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/test_game.py backend/tests/test_auth.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/rcon.py backend/app/game.py backend/app/main.py backend/tests/test_game.py backend/tests/test_auth.py
git commit -m "feat: players list and live log via RCON and journalctl"
```

---

## Task 6: Wire the frontend to the real API

**Files:**
- Modify: `frontend/index.html` (replace the mock-data `<script>` block)
- Modify: `frontend/login.html` (wire the form's submit)

**Interfaces:**
- Consumes: `/api/login`, `/api/logout`, `/api/status`, `/api/control/{action}`, `/api/metrics`, `/api/players`, `/api/logs/recent`, `/ws/logs` from Tasks 2-5, exactly as named there.

- [ ] **Step 1: Wire `login.html`**

On form submit, `event.preventDefault()`, `fetch("/api/login", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({username, password})})`; on `resp.ok` set `window.location = "/"`; on 401 show the existing `.error-box` (remove its `hidden`/display:none state, it already exists in the markup); on 429 show its text but with the message "Demasiados intentos, espera 15 minutos."

- [ ] **Step 2: Wire `index.html`'s status, tiles, controls and schedule toggle**

Replace the mock `scheduleSwitch` click handler with one that `POST`s `/api/control/schedule-on` or `schedule-off` depending on the new state, and reverts the toggle visually if the response isn't `ok`. Each `button.action` in the "Servidor" and "Respaldos" groups gets a click handler `POST`ing `/api/control/<its action>` (map by a `data-action` attribute added to each button in the markup) and disabling itself for the duration of the request. Poll `GET /api/status` every 5s and update the header's `.status-pill` classes/text and the "Estado" tile from its `status` field (`active` → online styling, anything else → offline styling). Leave the TPS tile and the 7 "Próximamente" controls exactly as they are (still `disabled`).

- [ ] **Step 3: Wire the charts and players list**

Replace the mock random-data generation with `fetch("/api/metrics")` every 10s, feeding its `labels`/`cpu`/`ram_vm_gb`/`ram_java_gb` arrays into the two existing `Chart` instances via `.data.labels = ...; .data.datasets[0].data = ...; .update()` (keep the existing gradient-fill dataset config from Task... the current file, just update data in place). Replace the static players `<li>` markup with a render function driven by `fetch("/api/players")` polled every 10s, keeping the existing avatar/online-dot/kick-ban markup structure (kick/ban buttons stay `disabled`).

- [ ] **Step 4: Wire the live log**

Load `GET /api/logs/recent` once on page load to fill `#logBox`, then open `new WebSocket(`wss://${location.host}/ws/logs`)` and append each incoming message as a new `<div>` in the same markup shape the existing lines use (`<span class="ts">`, `.lvl-info`/`.lvl-warn`), auto-scrolling the box to the bottom and respecting the existing Todo/Info/Warn filter buttons (apply the current active filter to newly appended lines too).

- [ ] **Step 5: Manual verification**

Run: `cd backend && uvicorn app.main:app --reload` with a `.env` populated from `.env.example` (generate a real bcrypt hash first: `python -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())"`).
Expected: visiting `http://localhost:8000/login.html`, logging in, landing on `/`, seeing real (not random) CPU/RAM numbers, start/stop/restart/backup buttons actually changing the local test server's state if one is running, and the log panel showing real `journalctl` output.

- [ ] **Step 6: Commit**

```bash
git add frontend/index.html frontend/login.html
git commit -m "feat: wire frontend to the real dashboard API"
```

---

## Task 7: Deploy to the VM (systemd, sudoers, Caddy)

**Files:**
- Create: `deploy/dashboard.service`
- Create: `deploy/dashboard-sudoers`
- Create: `deploy/Caddyfile`
- Create: `deploy/install.sh`

**Interfaces:**
- Consumes: `backend/` and `frontend/` from all prior tasks, deployed as-is.

- [ ] **Step 1: Write `deploy/install.sh`**

Idempotent script (run as root on the VM): create system user/group `dashboard` (no login shell) if absent; `mkdir -p /opt/dashboard` owned by `dashboard:dashboard`; `rsync` or `cp -r` this repo's `backend/` and `frontend/` into it (excluding `tests/`); create/activate a Python venv at `/opt/dashboard/venv`, `pip install -r backend/requirements.txt`; copy `.env` from a path given as `$1` (never generate secrets here — the caller supplies them) to `/opt/dashboard/.env`, `chmod 600`, `chown dashboard:dashboard`; install `deploy/dashboard-sudoers` to `/etc/sudoers.d/dashboard` (`chmod 440`, validate with `visudo -cf`); install `deploy/dashboard.service` to `/etc/systemd/system/dashboard.service`, `systemctl daemon-reload && systemctl enable --now dashboard`; install Caddy if `caddy` isn't on `PATH` (via its official apt repo); copy `deploy/Caddyfile` to `/etc/caddy/Caddyfile`, `systemctl reload caddy` (or `enable --now` if not yet running).

- [ ] **Step 2: Write `deploy/dashboard.service`**

```ini
[Unit]
Description=Create+ Dashboard
After=network.target

[Service]
User=dashboard
WorkingDirectory=/opt/dashboard
EnvironmentFile=/opt/dashboard/.env
ExecStart=/opt/dashboard/venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

- [ ] **Step 3: Write `deploy/dashboard-sudoers`**

```
dashboard ALL=(root) NOPASSWD: /usr/bin/systemctl start mc-create-plus, /usr/bin/systemctl stop mc-create-plus, /usr/bin/systemctl restart mc-create-plus, /usr/bin/systemctl status mc-create-plus, /usr/bin/journalctl -u mc-create-plus *
```

(Exact `systemctl`/`journalctl` absolute paths must be confirmed against `which systemctl journalctl` on the VM before this file is installed — adjust if different.)

- [ ] **Step 4: Write `deploy/Caddyfile`**

```
163-192-138-1.nip.io {
    reverse_proxy 127.0.0.1:8000
}
```

- [ ] **Step 5: Run on the VM and verify**

Copy the repo to the VM (e.g. `scp -r` or a first manual `git clone` of the now-pushed repo), run `sudo bash deploy/install.sh /path/to/real/.env`.
Run: `curl -s https://163-192-138-1.nip.io/api/health`
Expected: `{"status":"ok"}` over a valid HTTPS connection (Caddy obtained a cert automatically).
Run: `sudo -u dashboard sudo systemctl status mc-create-plus`
Expected: succeeds without a password prompt (confirms the sudoers scope works); `sudo -u dashboard sudo systemctl status mc-create-plus --help` style unrelated command should instead be refused.

- [ ] **Step 6: Commit**

```bash
git add deploy/dashboard.service deploy/dashboard-sudoers deploy/Caddyfile deploy/install.sh
git commit -m "feat: deploy artifacts for the dashboard (systemd, sudoers, Caddy)"
```

---

## Task 8: CI/CD via GitHub Actions

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: `deploy/install.sh` from Task 7 (re-run on every deploy; it is idempotent).

> **Stop and ask before this task's step 3.** Creating the GitHub repository and pushing to it publishes public content and is one of this session's actions that needs the user's explicit go-ahead at execution time, not just plan approval — confirm the repo name/visibility and that a dedicated deploy key (not the infra repo's `oracle_vm` key) should be generated, before running `gh repo create` or `git push`.

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

Trigger `on: push: branches: [main]`. Job `deploy`: checkout, then SSH to the VM (e.g. `appleboy/ssh-action@v1`) using secrets `DEPLOY_HOST` (the VM's reserved IP), `DEPLOY_USER`, `DEPLOY_SSH_KEY` (the dedicated key's private half) to run: `cd /opt/dashboard-src && git pull && sudo bash deploy/install.sh /opt/dashboard/.env` (the `.env` already exists on the VM from Task 7's manual run and is never touched by CI).

- [ ] **Step 2: Generate the dedicated deploy key and add it to the VM**

On the VM: `ssh-keygen -t ed25519 -f /tmp/dashboard-deploy -N ""`, append `/tmp/dashboard-deploy.pub` to the `dashboard` system user's (or a dedicated deploy user's) `~/.ssh/authorized_keys` restricted with a `command=` prefix limiting it to running the pull+install command, then discard the public key file. Keep the private half only in the GitHub secret, never in this repo.

- [ ] **Step 3: Create the repo and add secrets (after the user's explicit go-ahead)**

`gh repo create <org>/mc-create-plus-dashboard --public --source=. --remote=origin` (or the equivalent the user already set up manually); `gh secret set DEPLOY_HOST --body "163.192.138.1"`, `gh secret set DEPLOY_USER --body "..."`, `gh secret set DEPLOY_SSH_KEY < /path/to/private/key`.

- [ ] **Step 4: Verify with a real push**

Run: `git push origin main` (any trivial change, e.g. this task's own commit)
Expected: the Actions tab shows the `deploy` job succeeding; `curl -s https://163-192-138-1.nip.io/api/health` still returns `{"status":"ok"}` after the run.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: GitHub Actions deploy workflow"
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Full login-to-control round trip**

Log in at `https://163-192-138-1.nip.io/login.html` with the real admin credentials; confirm redirect to `/`; confirm the status pill, tiles, CPU/RAM charts and players list show real, changing data (not the old mock randomness).

- [ ] **Step 2: Each wired control**

Click Start/Stop/Restart/Backup ahora/Backup offsite/the horario toggle one at a time, confirming each produces the expected real effect on the VM (checked via `sudo mc-ctl status`/`backups/` directory/cron, as in the infra repo's own README) and that the UI reflects success/failure.

- [ ] **Step 3: Live log and the untouched "Próximamente" affordances**

Confirm the log panel streams real new lines when a player action happens in-game, and that chat input, raw console, kick/ban, and the 6 roadmap cards remain disabled and inert (no network requests fire from them).

- [ ] **Step 4: CI/CD round trip**

Make a trivial, reviewable change (e.g. a copy tweak), push to `main`, and confirm the live site reflects it within the workflow's run time without any manual step on the VM.
