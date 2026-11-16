import subprocess
from unittest.mock import patch

from backend.app.game import parse_player_list
from backend.tests.conftest import authed_client  # fixture: logged-in TestClient, see Task 2 pattern


def test_parse_player_list_with_players():
    raw = "There are 2 of a max of 8 players online: Guicho, Amigo1"
    assert parse_player_list(raw) == {"online": 2, "max": 8, "players": ["Guicho", "Amigo1"]}


def test_parse_player_list_empty():
    raw = "There are 0 of a max of 8 players online:"
    assert parse_player_list(raw) == {"online": 0, "max": 8, "players": []}


def test_recent_logs_returns_503_when_journalctl_missing(authed_client):
    with patch("backend.app.game.subprocess.run", side_effect=FileNotFoundError("journalctl not found")):
        resp = authed_client.get("/api/logs/recent")
    assert resp.status_code == 503
    assert resp.json() == {"detail": "logs unavailable"}


def test_recent_logs_returns_503_when_subprocess_errors(authed_client):
    with patch(
        "backend.app.game.subprocess.run",
        side_effect=subprocess.SubprocessError("boom"),
    ):
        resp = authed_client.get("/api/logs/recent")
    assert resp.status_code == 503
    assert resp.json() == {"detail": "logs unavailable"}


def test_ws_logs_closes_with_1011_when_journalctl_fails_to_launch(authed_client):
    # starlette's TestClient.websocket_connect always upgrades against
    # "ws://testserver", ignoring the https base_url used for the plain
    # HTTP requests above, so the Secure session cookie set by /api/login
    # isn't replayed automatically. Forward it explicitly via the Cookie
    # header so the handshake reaches the same authenticated session.
    session_cookie = authed_client.cookies.get("session")
    headers = {"cookie": f"session={session_cookie}"}
    with patch(
        "backend.app.game.asyncio.create_subprocess_exec",
        side_effect=FileNotFoundError("journalctl not found"),
    ):
        with authed_client.websocket_connect("/ws/logs", headers=headers) as websocket:
            # The server closes the connection immediately after the
            # subprocess launch fails; receiving should surface that close
            # rather than any streamed log line.
            try:
                websocket.receive_text()
                assert False, "expected the websocket to be closed"
            except Exception as exc:
                # starlette's test client raises WebSocketDisconnect with
                # the close code the server sent.
                assert getattr(exc, "code", None) == 1011
