from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from .router import api_router
from .config import settings
from .database import Base, engine, SessionLocal
from .seed import seed_if_empty

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
PRODUCT_UPLOADS_DIR = UPLOADS_DIR / "products"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
PRODUCT_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title=settings.app_name)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    user_columns = {column["name"] for column in inspector.get_columns("users")}
    if "role" not in user_columns:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(32) DEFAULT 'merchant'"))
    if "created_by_admin_id" not in user_columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE users ADD COLUMN created_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL"
                )
            )
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_created_by_admin_id ON users (created_by_admin_id)"))

    support_ticket_columns = {column["name"] for column in inspector.get_columns("support_tickets")}
    if "assigned_to_admin_id" not in support_ticket_columns:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE support_tickets ADD COLUMN assigned_to_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL"
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_support_tickets_assigned_to_admin_id ON support_tickets (assigned_to_admin_id)"
                )
            )
    with engine.begin() as conn:
        conn.execute(text("UPDATE users SET role = 'super_admin' WHERE username = 'jane_smith'"))
    with SessionLocal() as db:
        seed_if_empty(db)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api_router)
