from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Mounted last so it never shadows /api routes added by later tasks.
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
