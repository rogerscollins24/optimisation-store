from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "optimization-api"}


@router.get("/")
def root():
    """Root endpoint"""
    return {"message": "Optimization API is running", "version": "1.0.0"}
