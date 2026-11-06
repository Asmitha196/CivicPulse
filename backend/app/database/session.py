import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("civicpulse.database")
logging.basicConfig(level=logging.INFO)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/civicpulse")
SQLITE_FALLBACK_URL = os.getenv("SQLITE_FALLBACK_URL", "sqlite:///./civicpulse.db")

Base = declarative_base()

IS_POSTGRES = False
engine = None
SessionLocal = None

def init_db_engine():
    global engine, SessionLocal, IS_POSTGRES
    try:
        # First attempt connecting to PostgreSQL
        pg_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            # Attempt to create postgis extension if permitted
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.commit()
                logger.info("[Database] PostgreSQL connected with PostGIS extension enabled.")
            except Exception as ext_err:
                logger.warning(f"[Database] PostGIS extension notice: {ext_err}")
        
        engine = pg_engine
        IS_POSTGRES = True
        logger.info("[Database] Connected successfully to PostgreSQL.")
    except Exception as e:
        logger.warning(f"[Database] Could not connect to PostgreSQL ({e}). Falling back to local SQLite engine.")
        sqlite_engine = create_engine(
            SQLITE_FALLBACK_URL,
            connect_args={"check_same_thread": False}
        )
        engine = sqlite_engine
        IS_POSTGRES = False
        logger.info(f"[Database] Using SQLite fallback at {SQLITE_FALLBACK_URL}.")

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

init_db_engine()

def get_db():
    if SessionLocal is None:
        init_db_engine()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

