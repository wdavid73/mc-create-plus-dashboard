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
