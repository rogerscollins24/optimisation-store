from fastapi import APIRouter

from .api import router as legacy_router
from .support import router as support_router

api_router = APIRouter(prefix="/api")
api_router.include_router(legacy_router)
api_router.include_router(support_router, prefix="/support", tags=["support"])
