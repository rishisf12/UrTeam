"""FastAPI entrypoint. Auto-creates tables. CORS for Vite on 5173."""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import DB_LABEL, init_db
from .routes.students import router as students_router
from .routes.ideas import router as ideas_router
from .routes.matching import router as matching_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("teampilot")

app = FastAPI(title="TeamPilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(students_router)
app.include_router(ideas_router)
app.include_router(matching_router)


@app.on_event("startup")
def on_startup() -> None:
    try:
        init_db()
        logger.info("Startup OK. DB: %s", DB_LABEL)
    except Exception:
        logger.exception("Startup failed: could not init DB")
        raise


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/")
def root() -> dict:
    return {"service": "teampilot", "docs": "/docs"}
