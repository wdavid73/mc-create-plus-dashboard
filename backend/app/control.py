import os
import subprocess

from fastapi import APIRouter, Depends, HTTPException

from backend.app.auth import require_session

router = APIRouter()

# Whitelist of permitted control actions. The key is the URL path segment
# supplied by the (authenticated) caller; the value is the exact list of
# extra argv elements passed to mc-ctl. Nothing outside this dict's keys is
# ever allowed to reach subprocess.run, and the argv list is always built
# from fixed strings here, never from the raw path parameter.
ACTIONS: dict[str, list[str]] = {
    "start": ["start"],
    "stop": ["stop"],
    "restart": ["restart"],
    "backup-now": ["backup-now"],
    "backup-offsite": ["backup-offsite"],
    "schedule-on": ["schedule-on"],
    "schedule-off": ["schedule-off"],
}


@router.post("/api/control/{action}")
def control(action: str, user: str = Depends(require_session)):
    if action not in ACTIONS:
        raise HTTPException(status_code=400, detail="unknown action")

    result = subprocess.run(
        ["sudo", os.environ["MC_CTL_PATH"]] + ACTIONS[action],
        capture_output=True,
        text=True,
        timeout=30,
    )
    return {"ok": result.returncode == 0, "output": result.stdout + result.stderr}


@router.get("/api/status")
def status(user: str = Depends(require_session)):
    result = subprocess.run(
        ["systemctl", "is-active", os.environ["MC_SERVICE_NAME"]],
        capture_output=True,
        text=True,
    )
    return {"status": result.stdout.strip()}
