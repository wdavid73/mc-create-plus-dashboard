import os
import socket
import struct

# Source RCON packet types (see https://wiki.vg/RCON).
_SERVERDATA_AUTH = 3
_SERVERDATA_EXECCOMMAND = 2

_RCON_HOST = "127.0.0.1"
_SOCKET_TIMEOUT_SECONDS = 10


def _read_server_properties(path: str) -> dict[str, str]:
    """Parse a Minecraft server.properties-style key=value file."""
    properties: dict[str, str] = {}
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            properties[key.strip()] = value.strip()
    return properties


def _send_packet(sock: socket.socket, pkt_id: int, pkt_type: int, body: str) -> None:
    payload = struct.pack("<ii", pkt_id, pkt_type) + body.encode("utf8") + b"\x00\x00"
    sock.sendall(struct.pack("<i", len(payload)) + payload)


def _recv_packet(sock: socket.socket) -> tuple[int, int, str]:
    length = struct.unpack("<i", sock.recv(4))[0]
    data = b""
    while len(data) < length:
        chunk = sock.recv(length - len(data))
        if not chunk:
            # The socket closed mid-read; treat it the same as any other
            # transport failure below.
            raise ConnectionError("rcon connection closed unexpectedly")
        data += chunk
    pkt_id, pkt_type = struct.unpack("<ii", data[:8])
    body = data[8:-2].decode("utf8", errors="replace")
    return pkt_id, pkt_type, body


def send_rcon_command(command: str) -> str:
    """Send a single command over Source RCON and return its response body.

    Reads the RCON port/password from the server.properties-style file at
    os.environ["MC_SERVER_PROPERTIES"]. Any failure (missing/unreadable
    file, bad properties, socket/auth error) is raised as a generic
    RuntimeError -- never the original exception, which could echo the
    file path or the RCON password itself back to a caller.
    """
    try:
        properties_path = os.environ["MC_SERVER_PROPERTIES"]
        properties = _read_server_properties(properties_path)
        port = int(properties["rcon.port"])
        password = properties["rcon.password"]

        with socket.create_connection((_RCON_HOST, port), timeout=_SOCKET_TIMEOUT_SECONDS) as sock:
            _send_packet(sock, 1, _SERVERDATA_AUTH, password)
            auth_id, _, _ = _recv_packet(sock)
            if auth_id == -1:
                raise RuntimeError("rcon unavailable")

            _send_packet(sock, 2, _SERVERDATA_EXECCOMMAND, command)
            _, _, body = _recv_packet(sock)
            return body
    except RuntimeError:
        raise
    except Exception:
        # Never propagate the original exception: it may contain the
        # server.properties path or (in principle) the password value.
        raise RuntimeError("rcon unavailable") from None
