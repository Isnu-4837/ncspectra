# NCSpectra Backend

FastAPI backend for the NCSpectra narcotics field-testing app.

## Quick Start

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The DB (`ncspectra.db`) is created and seeded automatically on first run.

## Default Credentials (seed data)

| Field        | Value              |
|--------------|--------------------|
| Badge Number | `NCB-DEL-9842`     |
| Passcode     | `tactical-auth-2024` |

## API Docs

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/api/health

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → JWT token |
| GET | `/api/officers/me` | Authenticated officer profile |
| GET | `/api/reagents/` | List all reagents |
| GET | `/api/reagents/{id}` | Single reagent |
| GET | `/api/records/` | Officer's seizure records |
| POST | `/api/records/` | Create new record |
| GET | `/api/records/{id}` | Single record |
| POST | `/api/records/{id}/status` | Update record status |
| POST | `/api/analysis/` | Run spectral analysis → creates record |
| GET | `/api/analysis/{record_id}` | Get analysis for a record |
| GET | `/api/sync/summary` | Pending sync count + records |
| POST | `/api/sync/flush` | Mark all pending records as synced |
| GET | `/api/dashboard/summary` | Stats + recent records + officer info |
| GET | `/api/notifications/` | Officer notifications |
| POST | `/api/notifications/read-all` | Mark all notifications read |

## Folder Structure

```
backend/
└── app/
    ├── main.py               ← FastAPI app entry point
    ├── config.py             ← Settings from .env
    ├── database.py           ← SQLAlchemy engine + init_db
    ├── dependencies.py       ← get_db, get_current_officer
    ├── models/               ← ORM models (tables)
    ├── schemas/              ← Pydantic I/O models
    ├── api/
    │   └── routes/           ← Route handlers
    └── utils/
        ├── security.py       ← JWT + bcrypt
        ├── seed.py           ← Initial data
        └── domain.py         ← Business logic helpers
```

## Environment Variables

Copy `.env.example` to `.env` and adjust:

```
SECRET_KEY=change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=720
DATABASE_URL=sqlite:///./ncspectra.db
```

## Resetting the Database

To reset to seed data, stop the server, delete `ncspectra.db`, and restart:

```bash
Remove-Item ncspectra.db
uvicorn app.main:app --reload
```
