import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session, Session
from .config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy declarative Base class
Base = declarative_base()

# SQLAlchemy Engine with pool_pre_ping=True to discard stale connections
engine = None
SessionLocal = None

if settings.database_url:
    try:
        engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
        )
        SessionLocal = scoped_session(
            sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=engine,
            )
        )
    except Exception as exc:
        logger.error(f"Error initializing SQLAlchemy engine: {exc}")
        engine = None
        SessionLocal = None


def get_db():
    """
    Returns a scoped SQLAlchemy database session.
    """
    if SessionLocal is None:
        raise RuntimeError("Database session factory is not initialized. Check DATABASE_URL configuration.")
    return SessionLocal()


def check_db_connection() -> dict:
    """
    Utility function to verify database connectivity.
    Returns status dictionary for health check routines.
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
