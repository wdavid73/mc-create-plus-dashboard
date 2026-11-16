import bcrypt
import pytest
from fastapi.testclient import TestClient

from backend.app import auth as auth_module
from backend.app.main import app


def _client(monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", "admin")
    monkeypatch.setenv("ADMIN_PASSWORD_HASH", bcrypt.hashpw(b"correct-horse", bcrypt.gensalt()).decode())
    monkeypatch.setenv("SESSION_SECRET_KEY", "test-secret")
    monkeypatch.setenv("MC_CTL_PATH", "/usr/local/bin/mc-ctl")
    monkeypatch.setenv("MC_SERVICE_NAME", "mc-create-plus")
    # auth._failed_attempts is process-global, keyed by client IP. All
    # TestClients in this suite share the same "testclient" IP, so a login
    # lockout test in another test file (e.g. test_auth.py) would otherwise
    # leak into these fixtures and make a correct-password login 429 here.
    # Clear it so each fixture starts from a clean lockout state.
    auth_module._failed_attempts.clear()
    # The login/logout cookies are set with Secure=True, which httpx's test
    # client cookie jar only round-trips for requests made over https. Use an
    # https base_url so authed_client's session cookie is actually sent back
    # on subsequent requests instead of silently dropped.
    return TestClient(app, base_url="https://testserver")


@pytest.fixture
def client(monkeypatch):
    return _client(monkeypatch)


@pytest.fixture
def authed_client(monkeypatch):
    test_client = _client(monkeypatch)
    resp = test_client.post("/api/login", json={"username": "admin", "password": "correct-horse"})
    assert resp.status_code == 200
    return test_client
