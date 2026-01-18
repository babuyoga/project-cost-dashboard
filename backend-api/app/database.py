"""
Database Connection Module

This module handles the SQLAlchemy database connection to SQL Server.
It provides:
- Connection string configuration using environment variables
- SQLAlchemy engine and session factory
- FastAPI dependency for database session injection
- Test mode support for XLSX-based testing
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
import logging
from app.config import DB_USER, DB_PASSWORD, DB_HOST, DB_NAME, DB_DRIVER, TEST_MODE

logger = logging.getLogger(__name__)


# Only create real database connection when not in test mode
if not TEST_MODE:
    # Build the MSSQL connection string using pyodbc driver
    # The pool_pre_ping option ensures connections are validated before use
    connection_string = (
        f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}"
        f"@{DB_HOST}/{DB_NAME}?driver={DB_DRIVER.replace(' ', '+')}"
        "&TrustServerCertificate=yes"
    )
    
    # Log connection details (sanitized)
    logger.info("Initializing database connection...")
    logger.info(f"  Database Host: {DB_HOST}")
    logger.info(f"  Database Name: {DB_NAME}")
    logger.info(f"  Database User: {DB_USER}")
    logger.info(f"  Driver: {DB_DRIVER}")

    # Create SQLAlchemy engine with connection pooling
    try:
        engine = create_engine(connection_string, pool_pre_ping=True)
        logger.info("Database engine created successfully")
    except Exception as e:
        logger.error(f"Failed to create database engine: {e}")
        raise

    # Session factory for creating database sessions
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    logger.info("Database session factory configured")
else:
    # In test mode, we don't need a real database connection
    logger.info("TEST MODE: Database connection skipped (using XLSX files)")
    engine = None
    SessionLocal = None


def get_db():
    """
    FastAPI dependency that provides a database session.
    
    In test mode, yields None (the mock query function handles data loading).
    In production mode, yields a database session and ensures it's properly 
    closed after the request completes.
    
    Usage:
        @app.get("/endpoint")
        def my_endpoint(db: Session = Depends(get_db)):
            # use db here
    """
    if TEST_MODE:
        # In test mode, yield None - the query function uses XLSX files
        logger.debug("Yielding None for database session (TEST_MODE)")
        yield None
        return
    
    db = SessionLocal()
    logger.debug("Database session created")
    try:
        yield db
    finally:
        db.close()
        logger.debug("Database session closed")