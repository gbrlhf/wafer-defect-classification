import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from .config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy declarative Base class
Base = declarative_base()

# Engine creation with connection health checking
try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=settings.DEBUG and settings.APP_ENV == "development"
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.error(f"Error configuring database engine with URL {settings.DATABASE_URL}: {e}")
    engine = None
    SessionLocal = None

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a SQLAlchemy database session
    and guarantees proper session closing.
    """
    if SessionLocal is None:
        raise RuntimeError("Database session factory is not configured.")

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_connection() -> dict:
    """
    Utility function to verify database connectivity.
    Returns status dictionary for health check endpoints.
    """
    if engine is None:
        return {"status": "unconfigured", "error": "Database engine not initialized"}

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "connected"}
    except Exception as e:
        logger.warning(f"Database connection check failed: {e}")
        return {"status": "disconnected", "error": str(e)}
