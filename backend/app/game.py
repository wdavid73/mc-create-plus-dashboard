import asyncio
import os
import re
import subprocess

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from itsdangerous import BadSignature, SignatureExpired

from backend.app.auth import SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, _get_serializer, require_session
from backend.app.rcon import send_rcon_command

router = APIRouter()

_LIST_PATTERN = re.compile(r"There are (\d+) of a max of (\d+) players online:(.*)")

RECENT_LOG_LINES = "50"


def parse_player_list(raw: str) -> dict:
    """Parse the `list` command's response into online/max/players."""
    match = _LIST_PATTERN.search(raw)
    if not match:
        return {"online": 0, "max": 0, "players": []}

    online = int(match.group(1))
    max_players = int(match.group(2))
    trailing = match.group(3).strip()
    players = [name for name in (p.strip() for p in trailing.split(", ")) if name]

    return {"online": online, "max": max_players, "players": players}


@router.get("/api/players")
def get_players(user: str = Depends(require_session)):
    try:
        raw = send_rcon_command("list")
    except RuntimeError:
        raise HTTPException(status_code=503, detail="rcon unavailable")
    return parse_player_list(raw)


@router.get("/api/logs/recent")
def get_recent_logs(user: str = Depends(require_session)):
    result = subprocess.run(
        ["journalctl", "-u", os.environ["MC_SERVICE_NAME"], "-n", RECENT_LOG_LINES, "--no-pager", "-o", "cat"],
        capture_output=True,
        text=True,
    )
    return {"lines": result.stdout.splitlines()}


def _websocket_session_is_valid(websocket: WebSocket) -> bool:
    """Mirror require_session's checks for a WebSocket handshake.

    FastAPI's Depends() doesn't apply to WebSocket routes the way it does
    to HTTP routes, so the session cookie is verified by hand here, before
    the handshake is accepted.
    """
    token = websocket.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return False

    serializer = _get_serializer()
    try:
        payload = serializer.loads(token, max_age=SESSION_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return False

    return bool(payload.get("user"))


@router.websocket("/ws/logs")
async def ws_logs(websocket: WebSocket):
    if not _websocket_session_is_valid(websocket):
        await websocket.close(code=1008)
        return

    await websocket.accept()

    process = None
    try:
        process = await asyncio.create_subprocess_exec(
            "journalctl",
            "-u",
            os.environ["MC_SERVICE_NAME"],
            "-f",
            "-o",
            "cat",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )

        while True:
            line = await process.stdout.readline()
            if not line:
                break
            try:
                await websocket.send_text(line.decode("utf8", errors="replace").rstrip("\n"))
            except WebSocketDisconnect:
                break
    except WebSocketDisconnect:
        pass
    finally:
        if process is not None and process.returncode is None:
            process.terminate()
            await process.wait()
