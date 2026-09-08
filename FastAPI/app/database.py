from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

# connect_args only needed for SQLite (allows multi-threaded use)
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)

Base = declarative_base()


def init_db() -> None:
    """
    Create all tables using the metadata registered by ORM models.

    Models are imported via app/__init__.py before this is called,
    so Base.metadata already knows about every table.
    """
    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_record_columns()


def _ensure_sqlite_record_columns() -> None:
    """
    Idempotent migration shim for SQLite:
    adds any columns that were introduced after the initial schema was created,
    then back-fills sensible defaults so existing rows are not broken.
    """
    if "sqlite" not in settings.DATABASE_URL:
        return

    inspector = inspect(engine)
    if "seizure_records" not in inspector.get_table_names():
        return

    existing_columns = {col["name"] for col in inspector.get_columns("seizure_records")}
    needed = {
        "officer_name": "VARCHAR",
        "officer_badge_number": "VARCHAR",
        "live_location": "VARCHAR",
        "image_name": "VARCHAR",
    }

    with engine.begin() as conn:
        for col_name, col_type in needed.items():
            if col_name not in existing_columns:
                conn.execute(text(f"ALTER TABLE seizure_records ADD COLUMN {col_name} {col_type}"))
                print(f"  ✚  Added column seizure_records.{col_name}")

        # Back-fill NULL values for existing rows (safe for new DBs too)
        conn.execute(
            text(
                """
                UPDATE seizure_records
                SET
                    officer_name = COALESCE(officer_name, (
                        SELECT name FROM officers
                        WHERE officers.id = seizure_records.officer_id
                    )),
                    officer_badge_number = COALESCE(officer_badge_number, (
                        SELECT badge_number FROM officers
                        WHERE officers.id = seizure_records.officer_id
                    )),
                    live_location  = COALESCE(live_location,  location),
                    image_name     = COALESCE(image_name,     id || '.jpg')
                """
            )
        )
