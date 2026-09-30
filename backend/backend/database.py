"""DB engine with Postgres-to-SQLite fallback. Logs which DB is in use."""
import logging
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from .config import get_database_url

logger = logging.getLogger("teampilot")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = get_database_url()

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    DB_LABEL = "sqlite (%s)" % DATABASE_URL
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    DB_LABEL = "postgres (%s)" % DATABASE_URL


def init_db() -> None:
    """Auto-create tables. Logs engine in use. Raises on failure."""
    logger.info("Using database: %s", DB_LABEL)
    SQLModel.metadata.create_all(engine)
    logger.info("Tables ready.")


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency. Yields a Session, always closes it."""
    with Session(engine) as session:
        yield session
