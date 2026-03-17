from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import router
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
    with SessionLocal() as db:
        seed_if_empty(db)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(router, prefix="/api")
