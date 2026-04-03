"""Blueprint Router - Main router initialization file that combines all route modules"""

from fastapi import APIRouter

from .health import router as health_router
from .auth import router as auth_router
from .users import router as users_router
from .products import router as products_router

# Create main API router with /api prefix
api_router = APIRouter(prefix="/api")

# Include all blueprint routers
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(products_router)

__all__ = ["api_router", "health_router", "auth_router", "users_router", "products_router"]
