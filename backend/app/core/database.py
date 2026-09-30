from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

Base = declarative_base()

engine = None
SessionLocal = None

if settings.DATABASE_URL:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
    )
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )


def get_db() -> Generator[Session, None, None]:
    """
    SQLAlchemy database session dependency for FastAPI routes.
    Follows: FastAPI route -> get_db() -> SQLAlchemy Session -> PostgreSQL.
    Ensures that session is properly closed after request finishes.
    """
    if SessionLocal is None:
        raise RuntimeError("DATABASE_URL is not configured.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
