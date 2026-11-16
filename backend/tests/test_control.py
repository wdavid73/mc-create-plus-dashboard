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
    # The httpx test client normalizes ".." segments client-side before the
    # request is ever sent, so this collapses to POST /etc/passwd, which
    # never matches the /api/control/{action} route at all. It falls through
    # to the StaticFiles catch-all mounted at "/" (Task 1), which rejects
    # non-GET/HEAD methods with 405. That is a different status code than
    # originally planned (400/404), but the security property this test
    # exists for -- subprocess.run is never invoked for a traversal attempt
    # -- still holds, since the request never reaches control.py at all.
    assert resp.status_code in (400, 404, 405)
    mock_run.assert_not_called()

def test_shell_metacharacter_action_rejected(authed_client):
    with patch("backend.app.control.subprocess.run") as mock_run:
        resp = authed_client.post("/api/control/start;rm -rf /")
    # Same client-side normalization note as above: the trailing "/" from
    # "rm -rf /" makes this two path segments, which doesn't match the
    # single-segment /api/control/{action} route, so it also falls through
    # to the StaticFiles catch-all (405) rather than reaching our handler.
    # subprocess.run is still never invoked, which is the property under test.
    assert resp.status_code in (400, 405)
    mock_run.assert_not_called()

def test_unauthenticated_request_rejected(client):  # fixture: plain TestClient, no login
    resp = client.post("/api/control/start")
    assert resp.status_code == 401

def test_unknown_single_segment_action_rejected_by_whitelist(authed_client):
    # Supplements the two tests above: those inputs get normalized/split by
    # the HTTP client before ever reaching our route (see their comments),
    # so this exercises the actual `action not in ACTIONS` whitelist check
    # inside control.py directly, confirming it rejects with 400 before any
    # subprocess call for an arbitrary single-segment action name.
    with patch("backend.app.control.subprocess.run") as mock_run:
        resp = authed_client.post("/api/control/not-a-real-action")
    assert resp.status_code == 400
    mock_run.assert_not_called()
