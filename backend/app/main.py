from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.app.auth import router as auth_router

app = FastAPI()


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(auth_router)


# Mounted last so it never shadows /api routes added by later tasks.
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
