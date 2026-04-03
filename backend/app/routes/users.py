from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, ActivityLog
from ..schemas import UserCreateRequest, UserUpdateRequest, BalanceUpdateRequest, TrainingAccountCreateRequest
from ..enums import UserRole
from ..deps import get_optional_current_user
import random

router = APIRouter(prefix="/users", tags=["users"])

ADMIN_ROLES = {UserRole.SUPER_ADMIN.value, UserRole.SUB_ADMIN.value}


def _to_dict(model_obj, extra: dict | None = None) -> dict:
    """Convert SQLAlchemy model to dictionary"""
    result = {}
    for column in model_obj.__table__.columns:
        value = getattr(model_obj, column.name)
        if hasattr(value, "value"):
            value = value.value
        if hasattr(value, "isoformat"):
            value = value.isoformat()
        result[column.name] = value
    if extra:
        result.update(extra)
    return result


def _log_action(db: Session, request: Request | None, action: str, target: str, details: str) -> None:
    db.add(
        ActivityLog(
            admin="System",
            action=action,
            target=target,
            details=details,
            ip=request.client.host if request and request.client else "unknown",
        )
    )


def _normalize_role_value(role: str | UserRole | None) -> str:
    if isinstance(role, UserRole):
        return role.value
    return str(role or UserRole.MERCHANT.value)


def _allowed_created_roles(actor: User | None) -> set[str]:
    if actor is None:
        return {UserRole.MERCHANT.value}
    actor_role = _normalize_role_value(actor.role)
    if actor_role == UserRole.SUPER_ADMIN.value:
        return {UserRole.MERCHANT.value, UserRole.SUB_ADMIN.value, UserRole.SUPER_ADMIN.value}
    if actor_role == UserRole.SUB_ADMIN.value:
        return {UserRole.MERCHANT.value, UserRole.SUB_ADMIN.value}
    return {UserRole.MERCHANT.value}


def _resolve_created_role(actor: User | None, requested_role: str | UserRole | None) -> str:
    target_role = _normalize_role_value(requested_role)
    allowed_roles = _allowed_created_roles(actor)
    if target_role not in allowed_roles:
        raise HTTPException(status_code=403, detail="You are not allowed to create this account type")
    return target_role


def _resolve_updated_role(actor: User | None, requested_role: str | UserRole | None) -> str | None:
    if requested_role is None:
        return None
    target_role = _normalize_role_value(requested_role)
    allowed_roles = _allowed_created_roles(actor)
    if target_role not in allowed_roles:
        raise HTTPException(status_code=403, detail="You are not allowed to assign this role")
    return target_role


def _generate_invite_code(db: Session, prefix: str = "INV") -> str:
    """Generate unique invite code"""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    for _ in range(20):
        candidate = f"{prefix}{''.join(random.choice(alphabet) for _ in range(6))}"
        exists = db.scalar(select(User.id).where(User.invite_code == candidate))
        if not exists:
            return candidate
    raise HTTPException(status_code=500, detail="Failed to generate unique invite code")


@router.get("")
def get_users(db: Session = Depends(get_db)):
    """Get all users"""
    users = db.scalars(select(User).order_by(User.id)).all()
    return [_to_dict(user) for user in users]


@router.post("")
def create_user(
    payload: UserCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User | None = Depends(get_optional_current_user),
):
    """Create new user"""
    duplicate = db.scalar(
        select(User).where(or_(User.username == payload.username, User.email == payload.email))
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    target_role = _resolve_created_role(current_admin, payload.role)
    creator_id = current_admin.id if current_admin and _normalize_role_value(current_admin.role) in ADMIN_ROLES else None

    user = User(
        username=payload.username,
        email=payload.email,
        phone=payload.phone,
        login_password=payload.login_password,
        withdraw_password=payload.withdraw_password,
        gender=payload.gender,
        balance=payload.balance,
        commission=payload.commission,
        commission_today=payload.commission_today,
        vip_level=payload.vip_level,
        invite_code=payload.invite_code,
        referred_by=payload.referred_by,
        current_set=payload.current_set,
        task_count_today=payload.task_count_today,
        tasks_completed_in_set=payload.tasks_completed_in_set,
        set_starting_balance=payload.set_starting_balance,
        exchange=payload.exchange,
        wallet_address=payload.wallet_address,
        is_training_account=payload.is_training_account,
        trainer_owner_id=payload.trainer_owner_id,
        training_commission_rate=payload.training_commission_rate,
        status=payload.status,
        role=target_role,
        created_by_admin_id=creator_id,
    )
    db.add(user)
    db.flush()
    _log_action(
        db,
        request,
        "Created User",
        f"User ID: {user.id}",
        f"Created {user.username} as {target_role}",
    )
    db.commit()
    return {"success": True, "user": _to_dict(user)}


@router.post("/training-account")
def create_training_account(
    payload: TrainingAccountCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User | None = Depends(get_optional_current_user),
):
    """Create training account"""
    duplicate_username = db.scalar(select(User.id).where(User.username == payload.username))
    if duplicate_username:
        raise HTTPException(status_code=400, detail="Username already exists")

    inviter = db.scalar(select(User).where(User.invite_code == payload.referred_by))
    if not inviter:
        raise HTTPException(status_code=404, detail="Referral code not found")

    invite_code = payload.invite_code.strip() if payload.invite_code else None
    if invite_code:
        duplicate_invite = db.scalar(select(User.id).where(User.invite_code == invite_code))
        if duplicate_invite:
            raise HTTPException(status_code=400, detail="Invite code already exists")
    else:
        invite_code = _generate_invite_code(db, prefix="TRN")

    training_user = User(
        username=payload.username,
        email=f"{payload.username}.{random.randint(1000, 9999)}@training.local",
        phone=payload.phone,
        login_password=payload.login_password,
        withdraw_password=payload.withdraw_password,
        invite_code=invite_code,
        referred_by=payload.referred_by,
        is_training_account=True,
        trainer_owner_id=inviter.id,
        training_commission_rate=25.0,
        status="Active",
        role=UserRole.MERCHANT.value,
        created_by_admin_id=current_admin.id if current_admin and _normalize_role_value(current_admin.role) in ADMIN_ROLES else None,
    )
    db.add(training_user)
    db.flush()
    _log_action(
        db,
        request,
        "Created Training Account",
        f"User ID: {training_user.id}",
        f"Training account linked to inviter {inviter.username} ({payload.referred_by})",
    )
    db.commit()
    return {"success": True, "user": _to_dict(training_user)}


@router.put("/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User | None = Depends(get_optional_current_user),
):
    """Update user"""
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = payload.model_dump(exclude_none=True)
    if "role" in updates:
        updates["role"] = _resolve_updated_role(current_admin, updates["role"])
    for key, value in updates.items():
        setattr(db_user, key, value)

    _log_action(db, request, "Updated User", f"User ID: {user_id}", str(updates))
    db.commit()
    return {"success": True}


@router.delete("/{user_id}")
def delete_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    """Delete user"""
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    _log_action(db, request, "Deleted User", f"User ID: {user_id}", f"Deleted {db_user.username}")
    db.commit()
    return {"success": True}


@router.post("/{user_id}/lock")
def lock_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    """Lock/suspend user account"""
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.status = "Suspended"
    _log_action(db, request, "Locked User", f"User ID: {user_id}", "Suspicious activity detected")
    db.commit()
    return {"success": True}


@router.post("/{user_id}/balance")
def update_user_balance(user_id: int, payload: BalanceUpdateRequest, request: Request, db: Session = Depends(get_db)):
    """Update user balance"""
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    value = payload.amount if payload.type == "add" else -payload.amount
    db_user.balance = float(db_user.balance) + float(value)

    action = "Added Balance" if payload.type == "add" else "Deducted Balance"
    details = f"{'+' if payload.type == 'add' else '-'}${payload.amount} ({payload.reason})"
    _log_action(db, request, action, f"User ID: {user_id}", details)

    if payload.type == "add" and db_user.is_training_account and db_user.trainer_owner_id:
        inviter = db.get(User, db_user.trainer_owner_id)
        if inviter:
            commission_rate = float(db_user.training_commission_rate or 25.0)
            commission_amount = round(float(payload.amount) * (commission_rate / 100.0), 2)
            inviter.balance = float(inviter.balance) + commission_amount
            inviter.commission = float(inviter.commission) + commission_amount
            inviter.commission_today = float(inviter.commission_today) + commission_amount
            _log_action(
                db,
                request,
                "Training Commission Credit",
                f"User ID: {inviter.id}",
                f"+${commission_amount} from training account {db_user.username} (#{db_user.id})",
            )

    db.commit()
    return {"success": True}
