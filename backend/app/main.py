import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.app import metrics
from backend.app.auth import router as auth_router
from backend.app.control import router as control_router
from backend.app.game import router as game_router

FRONTEND_DIST = "frontend-react/dist"


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


# Hashed build assets (JS/CSS) only — never shadows /api routes since
# nothing under /api/* or /ws/* starts with /assets. check_dir=False:
# the frontend build may not exist yet (fresh checkout, running tests
# without building the frontend first), and that shouldn't block the
# backend from importing or starting.
app.mount(
    "/assets",
    StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets"), check_dir=False),
    name="frontend-assets",
)


# Registered last so it never shadows /api or /ws routes. React Router
# serves client-side routes like /console or /players that don't exist
# as files on disk, so a plain StaticFiles(html=True) mount (which 404s
# on those instead of falling back to index.html) isn't enough: this
# serves a matching static file verbatim (favicon, images, ...) and
# falls back to index.html for everything else, letting the SPA's own
# router take over.
@app.get("/{full_path:path}")
def spa(full_path: str):
    candidate = os.path.join(FRONTEND_DIST, full_path)
    if full_path and os.path.isfile(candidate):
        return FileResponse(candidate)
    return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
