import asyncio
import logging
from collections import deque
from datetime import datetime

import psutil
from fastapi import APIRouter, Depends

from backend.app.auth import require_session

logger = logging.getLogger(__name__)

router = APIRouter()

SAMPLE_INTERVAL_SECONDS = 10
# Forge launch argument used in the service's ExecStart; identifies the server JVM.
JAVA_PROCESS_MARKER = "unix_args.txt"


class MetricsBuffer:
    def __init__(self, maxlen: int = 720):
        self._labels: deque[str] = deque(maxlen=maxlen)
        self._cpu: deque[float] = deque(maxlen=maxlen)
        self._ram_vm_gb: deque[float] = deque(maxlen=maxlen)
        self._ram_java_gb: deque[float] = deque(maxlen=maxlen)

    def append(self, cpu_pct: float, ram_vm_gb: float, ram_java_gb: float) -> None:
        self._labels.append(datetime.now().isoformat())
        self._cpu.append(cpu_pct)
        self._ram_vm_gb.append(ram_vm_gb)
        self._ram_java_gb.append(ram_java_gb)

    def snapshot(self) -> dict:
        return {
            "labels": list(self._labels),
            "cpu": list(self._cpu),
            "ram_vm_gb": list(self._ram_vm_gb),
            "ram_java_gb": list(self._ram_java_gb),
        }


buffer = MetricsBuffer()


def _find_java_process():
    for proc in psutil.process_iter(["name", "cmdline"]):
        cmdline = proc.info.get("cmdline") or []
        if any(JAVA_PROCESS_MARKER in arg for arg in cmdline):
            return proc
    return None


def sample_once() -> tuple[float, float, float]:
    cpu = psutil.cpu_percent(interval=None)
    ram_vm_gb = psutil.virtual_memory().used / 1e9
    ram_java_gb = 0.0
    try:
        process = _find_java_process()
        if process is not None:
            ram_java_gb = process.memory_info().rss / 1e9
    except psutil.Error:
        # The process exited or is inaccessible between lookup and read; treat as not found.
        ram_java_gb = 0.0
    return float(cpu), float(ram_vm_gb), float(ram_java_gb)


async def sampler_loop(target: MetricsBuffer, interval: float = SAMPLE_INTERVAL_SECONDS) -> None:
    while True:
        try:
            cpu, ram_vm_gb, ram_java_gb = await asyncio.to_thread(sample_once)
            target.append(cpu_pct=cpu, ram_vm_gb=ram_vm_gb, ram_java_gb=ram_java_gb)
        except Exception:
            # One bad sample must never kill the sampling loop.
            logger.exception("metrics sample failed")
        await asyncio.sleep(interval)


@router.get("/api/metrics")
def get_metrics(user: str = Depends(require_session)):
    return buffer.snapshot()
