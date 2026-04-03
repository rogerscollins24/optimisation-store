from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..deps import create_access_token, get_optional_current_user
from ..schemas import LoginRequest, LoginResponse
from ..enums import UserRole

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return access token"""
    user = db.scalar(select(User).where(User.username == payload.username))
    if not user or user.login_password != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": user.username})
    return LoginResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        phone=user.phone,
        balance=float(user.balance),
        commission_today=float(user.commission_today),
        vip_level=user.vip_level,
        invite_code=user.invite_code,
        credit_score=user.credit_score,
        tasks_completed_in_set=user.tasks_completed_in_set,
        task_count_today=user.task_count_today,
        withdraw_password=user.withdraw_password,
        access_token=access_token,
    )


@router.post("/verify")
def verify_token(current_user: User | None = Depends(get_optional_current_user)):
    """Verify if token is valid"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
    return {"valid": True, "user_id": current_user.id, "username": current_user.username}
