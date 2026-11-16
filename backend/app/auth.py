import os
import threading
import time

import bcrypt
from fastapi import APIRouter, HTTPException, Request, Response
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from pydantic import BaseModel

router = APIRouter()

SESSION_COOKIE_NAME = "session"
SESSION_MAX_AGE_SECONDS = 86400

LOCKOUT_WINDOW_SECONDS = 15 * 60
LOCKOUT_THRESHOLD = 5

# In-memory only: failed-attempt timestamps per client IP, used purely to
# throttle brute-force login attempts within a single process. This does not
# persist across restarts, is not shared across multiple worker processes,
# and is not a durable audit log of failed logins.
_failed_attempts: dict[str, list[float]] = {}
# Guards all reads/writes to _failed_attempts, since FastAPI runs sync route
# handlers in a thread pool and the prune-check-append sequence below must be
# atomic to prevent concurrent requests from the same client racing past the
# lockout threshold.
_failed_attempts_lock = threading.Lock()


class LoginRequest(BaseModel):
    username: str
    password: str


def _get_serializer() -> URLSafeTimedSerializer:
    secret = os.environ["SESSION_SECRET_KEY"]
    return URLSafeTimedSerializer(secret)


def _prune_old_attempts(client_id: str, now: float) -> list[float]:
    attempts = [t for t in _failed_attempts.get(client_id, []) if now - t < LOCKOUT_WINDOW_SECONDS]
    if attempts:
        _failed_attempts[client_id] = attempts
    else:
        _failed_attempts.pop(client_id, None)
    return attempts


def _get_client_id(request: Request) -> str:
    # Behind a reverse proxy (e.g. Caddy), request.client.host is the proxy's
    # own address, not the real client. Caddy appends the real client IP it
    # observed to X-Forwarded-For; the LAST entry is the one our one and only
    # trusted hop (Caddy) added, and is never attacker-controlled. The FIRST
    # entry is whatever the original client sent in that header, which an
    # attacker can set to anything — trusting it would let them pick a fresh
    # fake IP on every request and defeat the lockout entirely.
    forwarded_for = request.headers.get("x-forwarded-for", "")
    hops = [h.strip() for h in forwarded_for.split(",") if h.strip()]
    if hops:
        return hops[-1]
    return request.client.host if request.client else "unknown"


@router.post("/api/login")
def login(body: LoginRequest, request: Request, response: Response):
    client_id = _get_client_id(request)
    now = time.time()

    with _failed_attempts_lock:
        attempts = _prune_old_attempts(client_id, now)
        if len(attempts) >= LOCKOUT_THRESHOLD:
            raise HTTPException(status_code=429, detail="Too many failed login attempts. Try again later.")

    admin_username = os.environ.get("ADMIN_USERNAME", "")
    admin_password_hash = os.environ.get("ADMIN_PASSWORD_HASH", "")

    valid = body.username == admin_username and admin_password_hash and bcrypt.checkpw(
        body.password.encode("utf-8"), admin_password_hash.encode("utf-8")
    )

    if not valid:
        with _failed_attempts_lock:
            attempts = _prune_old_attempts(client_id, now)
            attempts.append(now)
            _failed_attempts[client_id] = attempts
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Successful login clears this client's failed-attempt history.
    with _failed_attempts_lock:
        _failed_attempts.pop(client_id, None)

    serializer = _get_serializer()
    token = serializer.dumps({"user": body.username})
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=SESSION_MAX_AGE_SECONDS,
    )
    return {"status": "ok"}


@router.post("/api/logout")
def logout(response: Response):
    response.delete_cookie(key=SESSION_COOKIE_NAME, httponly=True, secure=True, samesite="strict")
    return {"status": "ok"}


def require_session(request: Request) -> str:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    serializer = _get_serializer()
    try:
        payload = serializer.loads(token, max_age=SESSION_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = payload.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return user
