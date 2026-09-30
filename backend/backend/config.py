"""App config. Reads DATABASE_URL from .env, defaults to SQLite."""
import logging
import os
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("teampilot")

SQLITE_FALLBACK = "sqlite:///./teampilot.db"


def get_database_url(env: Optional[dict] = None) -> str:
    """Return DATABASE_URL or SQLite fallback. Never raises."""
    source = env if env is not None else os.environ
    url = str(source.get("DATABASE_URL", "")).strip()
    if not url:
        logger.info("DATABASE_URL not set, using SQLite fallback: %s", SQLITE_FALLBACK)
        return SQLITE_FALLBACK
    return url
