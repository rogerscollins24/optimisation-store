from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from .router import api_router
from .config import settings
from .database import Base, engine, SessionLocal
from .seed import seed_if_empty

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
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
    with engine.begin() as conn:
        conn.execute(text("UPDATE users SET role = 'super_admin' WHERE username = 'jane_smith'"))
    with SessionLocal() as db:
        seed_if_empty(db)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api_router)
