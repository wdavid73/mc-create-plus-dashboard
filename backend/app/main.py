import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.app import metrics
from backend.app.auth import router as auth_router
from backend.app.control import router as control_router
from backend.app.game import router as game_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    sampler = asyncio.create_task(metrics.sampler_loop(metrics.buffer))
    try:
        yield
    finally:
        sampler.cancel()
        try:
            await sampler
        except asyncio.CancelledError:
            pass


app = FastAPI(lifespan=lifespan)


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(control_router)
app.include_router(metrics.router)
app.include_router(game_router)


# Mounted last so it never shadows /api routes added by later tasks.
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
