import asyncio
import os
import re
import subprocess

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from itsdangerous import BadSignature, SignatureExpired
from pydantic import BaseModel

from backend.app.auth import SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, _get_serializer, require_session
from backend.app.rcon import send_rcon_command

router = APIRouter()

_LIST_PATTERN = re.compile(r"There are (\d+) of a max of (\d+) players online:(.*)")

# Minecraft usernames are 1-16 characters of [A-Za-z0-9_]. Enforcing this
# before building an RCON command string is what keeps a crafted name (one
# containing a space or newline) from injecting a second command.
_PLAYER_NAME_PATTERN = re.compile(r"^\w{1,16}$")

RECENT_LOG_LINES = "50"

# Whitelist of permitted one-shot world commands. The key is the URL path
# segment supplied by the (authenticated) caller; the value is the exact
# RCON command sent. Nothing outside this dict's keys ever reaches
# send_rcon_command, and the command string is always a fixed literal here,
# never built from the raw path parameter.
GAME_COMMANDS: dict[str, str] = {
    "time-day": "time set day",
    "time-night": "time set night",
    "weather-clear": "weather clear",
}


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


@router.post("/api/game/command/{action}")
def run_game_command(action: str, user: str = Depends(require_session)):
    if action not in GAME_COMMANDS:
        raise HTTPException(status_code=400, detail="unknown action")
    try:
        output = send_rcon_command(GAME_COMMANDS[action])
    except RuntimeError:
        raise HTTPException(status_code=503, detail="rcon unavailable")
    return {"ok": True, "output": output}


class TeleportRequest(BaseModel):
    from_player: str
    to_player: str


@router.post("/api/game/tp")
def teleport_player(body: TeleportRequest, user: str = Depends(require_session)):
    for name in (body.from_player, body.to_player):
        if not _PLAYER_NAME_PATTERN.match(name):
            raise HTTPException(status_code=400, detail="invalid player name")
    try:
        output = send_rcon_command(f"tp {body.from_player} {body.to_player}")
    except RuntimeError:
        raise HTTPException(status_code=503, detail="rcon unavailable")
    return {"ok": True, "output": output}


@router.get("/api/logs/recent")
def get_recent_logs(user: str = Depends(require_session)):
    try:
        result = subprocess.run(
            ["journalctl", "-u", os.environ["MC_SERVICE_NAME"], "-n", RECENT_LOG_LINES, "--no-pager", "-o", "cat"],
            capture_output=True,
            text=True,
        )
    except (OSError, subprocess.SubprocessError):
        raise HTTPException(status_code=503, detail="logs unavailable")
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
        except (OSError, subprocess.SubprocessError):
            await websocket.close(code=1011)
            return

        while True:
            line = await process.stdout.readline()
            if not line:
                break
            try:
                await websocket.send_text(line.decode("utf8", errors="replace").rstrip("\n"))
            except (WebSocketDisconnect, RuntimeError):
                break
    except WebSocketDisconnect:
        pass
    finally:
        if process is not None and process.returncode is None:
            process.terminate()
            await process.wait()
