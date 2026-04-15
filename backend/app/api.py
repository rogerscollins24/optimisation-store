from datetime import datetime, timezone
import random
import re
import secrets
import shutil
from pathlib import Path
from typing import cast
from uuid import uuid4

from deep_translator import GoogleTranslator
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from .deps import create_access_token, get_optional_current_user
from .database import get_db
from .models import ActivityLog, Combo, ComboItem, Notification, Product, Setting, SupportTicket, Task, User, UserTask, Withdrawal
from .enums import UserRole
from .schemas import (
    BalanceUpdateRequest,
    LoginRequest,
    ComboCreateRequest,
    ComboUpdateRequest,
    NotificationCreateRequest,
    NotificationUpdateRequest,
    ProductCreateRequest,
    ProductUpdateRequest,
    SettingsBulkUpdateRequest,
    SettingUpdateRequest,
    TaskCreateRequest,
    TaskStartRequest,
    SubmitTaskRequest,
    TaskUpdateRequest,
    TrainingAccountCreateRequest,
    TranslateBatchRequest,
    TranslateBatchResponse,
    UserCreateRequest,
    UserUpdateRequest,
)

router = APIRouter()

ADMIN_ROLES = {UserRole.SUPER_ADMIN.value, UserRole.SUB_ADMIN.value}
BASE_DIR = Path(__file__).resolve().parent.parent
PRODUCT_UPLOADS_DIR = BASE_DIR / "uploads" / "products"
MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_PRODUCT_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_PRODUCT_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


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
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    for _ in range(20):
        candidate = f"{prefix}{''.join(random.choice(alphabet) for _ in range(6))}"
        exists = db.scalar(select(User.id).where(User.invite_code == candidate))
        if not exists:
            return candidate
    raise HTTPException(status_code=500, detail="Failed to generate unique invite code")


def _to_dict(model_obj, extra: dict | None = None) -> dict:
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


def _resolve_managed_admin_id(db: Session, managed_by_admin_id: int | None) -> int | None:
    if managed_by_admin_id is None:
        return None
    assignee = db.get(User, managed_by_admin_id)
    if not assignee or _normalize_role_value(assignee.role) != UserRole.SUB_ADMIN.value:
        raise HTTPException(status_code=400, detail="Support owner must be an existing sub admin")
    return assignee.id


def _coerce_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        if len(value) == 10:
            return datetime.fromisoformat(value)
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid datetime format")


def _reset_daily_metrics_if_due(user: User) -> bool:
    now_utc = datetime.now(timezone.utc)
    last_reset = cast(datetime | None, user.last_commission_reset)

    if last_reset is None:
        setattr(user, "last_commission_reset", now_utc)
        if float(user.commission_today or 0) != 0 or int(user.task_count_today or 0) != 0:
            user.commission_today = 0
            user.task_count_today = 0
            return True
        return False

    if last_reset.tzinfo is None:
        last_reset = last_reset.replace(tzinfo=timezone.utc)
    else:
        last_reset = last_reset.astimezone(timezone.utc)

    if last_reset.date() < now_utc.date():
        user.commission_today = 0
        user.task_count_today = 0
        setattr(user, "last_commission_reset", now_utc)
        return True

    return False


def _serialize_user(user: User) -> dict:
    payload = _to_dict(user)
    cfg = _VIP_CONFIG.get(user.vip_level, {"tasks_per_set": 60, "rate": 0.09})
    total_tasks = int(cfg["tasks_per_set"])
    payload["remaining_tasks"] = max(total_tasks - int(user.tasks_completed_in_set or 0), 0)
    payload["tasks_per_set"] = total_tasks
    return payload


def _log_action(db: Session, request: Request | None, action: str, target: str, details: str) -> None:
    db.add(
        ActivityLog(
            admin="Super Admin",
            action=action,
            target=target,
            details=details,
            ip=request.client.host if request and request.client else "unknown",
        )
    )


def _save_product_image(image: UploadFile) -> str:
    if not image.filename:
        raise HTTPException(status_code=400, detail="Image file is required")

    extension = Path(image.filename).suffix.lower()
    if extension not in ALLOWED_PRODUCT_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported image file type")

    if image.content_type not in ALLOWED_PRODUCT_IMAGE_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image MIME type")

    image.file.seek(0, 2)
    file_size = image.file.tell()
    image.file.seek(0)

    if file_size > MAX_PRODUCT_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be 5MB or smaller")

    PRODUCT_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    destination = PRODUCT_UPLOADS_DIR / filename

    with destination.open("wb") as out_file:
        shutil.copyfileobj(image.file, out_file)

    return f"/api/uploads/products/{filename}"


def _load_combo_items(db: Session, combo_ids: list[int]) -> dict[int, list[dict]]:
    if not combo_ids:
        return {}

    rows = db.execute(
        select(ComboItem, Product.name)
        .join(Product, ComboItem.product_id == Product.id)
        .where(ComboItem.combo_id.in_(combo_ids))
        .order_by(ComboItem.combo_id, ComboItem.id)
    ).all()

    grouped: dict[int, list[dict]] = {}
    for combo_item, product_name in rows:
        grouped.setdefault(combo_item.combo_id, []).append(
            {
                "id": combo_item.id,
                "product_id": combo_item.product_id,
                "product_name": product_name,
                "price": combo_item.custom_price,
                "commission": combo_item.custom_commission,
            }
        )
    return grouped


def _extract_combo_id(task_code: str) -> int | None:
    if not task_code.startswith("CMB-"):
        return None
    parts = task_code.split("-", 2)
    if len(parts) < 3:
        return None
    try:
        return int(parts[1])
    except ValueError:
        return None


def _pick_random_product_for_balance(db: Session, balance: float) -> Product | None:
    if balance <= 0:
        return None

    eligible_products = db.scalars(
        select(Product).where(Product.price < balance, Product.status == "Active")
    ).all()
    if not eligible_products:
        return None

    # As balance rises, favor a higher price band while preserving randomness.
    if balance < 100:
        floor_ratio = 0.20
    elif balance < 500:
        floor_ratio = 0.40
    elif balance < 1000:
        floor_ratio = 0.55
    else:
        floor_ratio = 0.70

    band_floor = balance * floor_ratio
    band_candidates = [product for product in eligible_products if float(product.price) >= band_floor]
    pool = band_candidates if band_candidates else eligible_products
    return random.choice(pool)


def _get_support_chat_url(db: Session) -> str:
    setting = db.get(Setting, "support_chat_url")
    if not setting or not setting.value:
        return "https://t.me/"
    return setting.value


def _format_task_record(task: UserTask, combo_products: list[dict] | None = None) -> dict:
    record = _to_dict(task)
    combo_id = _extract_combo_id(task.task_code)
    record["is_combo"] = combo_id is not None
    record["combo_id"] = combo_id
    record["products"] = combo_products or []
    return record


_PLACEHOLDER_PATTERN = re.compile(r"\{[^{}]+\}")


def _protect_placeholders(text: str) -> tuple[str, dict[str, str]]:
    replacements: dict[str, str] = {}

    def repl(match: re.Match[str]) -> str:
        index = len(replacements)
        token = f"ZZPH_{index}_ZZ"
        replacements[token] = match.group(0)
        return token

    return _PLACEHOLDER_PATTERN.sub(repl, text), replacements


def _restore_placeholders(text: str, replacements: dict[str, str]) -> str:
    restored = text
    for token, original in replacements.items():
        restored = restored.replace(token, original)
    return restored


def _batch_translate_texts(texts: list[str], source_language: str, target_language: str) -> list[str]:
    if not texts or source_language == target_language:
        return texts

    translated: list[str] = []

    for text in texts:
        stripped = text.strip()
        if not stripped:
            translated.append(text)
            continue

        protected_text, replacements = _protect_placeholders(text)
        try:
            candidate = GoogleTranslator(source=source_language, target=target_language).translate(protected_text)
            if not isinstance(candidate, str) or not candidate.strip():
                translated.append(text)
                continue
            translated.append(_restore_placeholders(candidate, replacements))
        except Exception:
            translated.append(text)

    return translated


@router.get("/users")
def get_users(role: str | None = Query(default=None), db: Session = Depends(get_db)):
    query = select(User).order_by(User.id)
    if role:
        query = query.where(User.role == role)
    users = db.scalars(query).all()
    return [_serialize_user(user) for user in users]


@router.post("/users")
def create_user(
    payload: UserCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User | None = Depends(get_optional_current_user),
):
    duplicate = db.scalar(
        select(User).where(or_(User.username == payload.username, User.email == payload.email))
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    target_role = _resolve_created_role(current_admin, payload.role)
    creator_id = current_admin.id if current_admin and _normalize_role_value(current_admin.role) in ADMIN_ROLES else None
    managed_by_admin_id = _resolve_managed_admin_id(db, payload.managed_by_admin_id)
    if managed_by_admin_id is None and target_role == UserRole.MERCHANT.value and current_admin:
        if _normalize_role_value(current_admin.role) == UserRole.SUB_ADMIN.value:
            managed_by_admin_id = current_admin.id

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
        last_commission_reset=_coerce_datetime(payload.last_commission_reset),
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
        managed_by_admin_id=managed_by_admin_id,
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


@router.post("/users/training-account")
def create_training_account(
    payload: TrainingAccountCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User | None = Depends(get_optional_current_user),
):
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
        managed_by_admin_id=current_admin.id if current_admin and _normalize_role_value(current_admin.role) == UserRole.SUB_ADMIN.value else None,
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


@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User | None = Depends(get_optional_current_user),
):
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = payload.model_dump(exclude_none=True)
    if "role" in updates:
        updates["role"] = _resolve_updated_role(current_admin, updates["role"])
    if "managed_by_admin_id" in updates:
        updates["managed_by_admin_id"] = _resolve_managed_admin_id(db, updates["managed_by_admin_id"])
    if "last_commission_reset" in updates:
        updates["last_commission_reset"] = _coerce_datetime(updates["last_commission_reset"])
    for key, value in updates.items():
        setattr(db_user, key, value)

    _log_action(db, request, "Updated User", f"User ID: {user_id}", str(updates))
    db.commit()
    return {"success": True}


@router.put("/users/{user_id}/profile")
def update_client_profile(
    user_id: int,
    payload: UserUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    current_role = _normalize_role_value(current_user.role)
    if current_user.id != user_id and current_role not in ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="You are not allowed to update this profile")

    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    allowed_fields = {"email", "phone", "gender", "exchange", "wallet_address"}
    updates = {key: value for key, value in payload.model_dump(exclude_none=True).items() if key in allowed_fields}
    for key, value in updates.items():
        setattr(db_user, key, value)

    _log_action(db, request, "Updated Client Profile", f"User ID: {user_id}", str(updates))
    db.commit()
    return {"success": True, "user": _serialize_user(db_user)}


@router.put("/users/{user_id}/support-assignment")
def assign_user_support_owner(
    user_id: int,
    payload: UserUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User | None = Depends(get_optional_current_user),
):
    if not current_admin or _normalize_role_value(current_admin.role) != UserRole.SUPER_ADMIN.value:
        raise HTTPException(status_code=403, detail="Only super admins can assign support owners")

    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if _normalize_role_value(db_user.role) in ADMIN_ROLES:
        raise HTTPException(status_code=400, detail="Only client accounts can be assigned to a sub admin")

    managed_by_admin_id = _resolve_managed_admin_id(db, payload.managed_by_admin_id)
    db_user.managed_by_admin_id = managed_by_admin_id

    ticket_query = db.query(SupportTicket).filter(SupportTicket.user_id == user_id)
    ticket_query.update({SupportTicket.assigned_to_admin_id: managed_by_admin_id}, synchronize_session=False)

    owner_label = f"sub_admin #{managed_by_admin_id}" if managed_by_admin_id else "unassigned"
    _log_action(db, request, "Updated Client Support Owner", f"User ID: {user_id}", owner_label)
    db.commit()
    return {"success": True, "user": _serialize_user(db_user)}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(db_user)
    _log_action(db, request, "Deleted User", f"User ID: {user_id}", f"Deleted {db_user.username}")
    db.commit()
    return {"success": True}


@router.post("/users/{user_id}/lock")
def lock_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.status = "Suspended"
    _log_action(db, request, "Locked User", f"User ID: {user_id}", "Suspicious activity detected")
    db.commit()
    return {"success": True}


@router.post("/users/{user_id}/balance")
def update_user_balance(user_id: int, payload: BalanceUpdateRequest, request: Request, db: Session = Depends(get_db)):
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    _reset_daily_metrics_if_due(db_user)
    value = payload.amount if payload.type == "add" else -payload.amount
    db_user.balance = float(db_user.balance) + float(value)

    action = "Added Balance" if payload.type == "add" else "Deducted Balance"
    details = f"{'+' if payload.type == 'add' else '-'}${payload.amount} ({payload.reason})"
    _log_action(db, request, action, f"User ID: {user_id}", details)

    if payload.type == "add" and db_user.is_training_account and db_user.trainer_owner_id:
        inviter = db.get(User, db_user.trainer_owner_id)
        if inviter:
            _reset_daily_metrics_if_due(inviter)
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


@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    products = db.scalars(select(Product).order_by(Product.id)).all()
    return [_to_dict(product) for product in products]


@router.post("/products/upload-image")
def upload_product_image(request: Request, image: UploadFile = File(...), db: Session = Depends(get_db)):
    image_url = _save_product_image(image)
    _log_action(db, request, "Uploaded Product Image", "Products", image.filename or image_url)
    db.commit()
    return {"success": True, "image_url": image_url}


@router.post("/products")
def create_product(payload: ProductCreateRequest, request: Request, db: Session = Depends(get_db)):
    product = Product(
        name=payload.name,
        description=payload.description,
        image_url=payload.image_url,
        price=payload.price,
        commission_rate=payload.commission_rate,
        stock=payload.stock,
        status=payload.status,
    )
    db.add(product)
    db.flush()
    _log_action(db, request, "Created Product", f"Product ID: {product.id}", product.name)
    db.commit()
    return {"success": True, "product": _to_dict(product)}


@router.put("/products/{product_id}")
def update_product(product_id: int, payload: ProductUpdateRequest, request: Request, db: Session = Depends(get_db)):
    db_product = db.get(Product, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = payload.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(db_product, key, value)

    _log_action(db, request, "Updated Product", f"Product ID: {product_id}", str(updates))
    db.commit()
    return {"success": True}


@router.delete("/products/{product_id}")
def delete_product(product_id: int, request: Request, db: Session = Depends(get_db)):
    db_product = db.get(Product, product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(db_product)
    _log_action(db, request, "Deleted Product", f"Product ID: {product_id}", db_product.name)
    db.commit()
    return {"success": True}


@router.get("/tasks")
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.scalars(select(Task).order_by(Task.id)).all()
    return [_to_dict(task) for task in tasks]


@router.post("/tasks")
def create_task(payload: TaskCreateRequest, request: Request, db: Session = Depends(get_db)):
    task = Task(
        title=payload.title,
        description=payload.description,
        reward=payload.reward,
        type=payload.type,
        status=payload.status,
    )
    db.add(task)
    db.flush()
    _log_action(db, request, "Created Task", f"Task ID: {task.id}", task.title)
    db.commit()
    return {"success": True, "task": _to_dict(task)}


@router.put("/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdateRequest, request: Request, db: Session = Depends(get_db)):
    db_task = db.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    updates = payload.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(db_task, key, value)

    _log_action(db, request, "Updated Task", f"Task ID: {task_id}", str(updates))
    db.commit()
    return {"success": True}


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, request: Request, db: Session = Depends(get_db)):
    db_task = db.get(Task, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(db_task)
    _log_action(db, request, "Deleted Task", f"Task ID: {task_id}", db_task.title)
    db.commit()
    return {"success": True}


@router.post("/tasks/start")
def start_task(payload: TaskStartRequest, db: Session = Depends(get_db)):
    user = db.get(User, payload.userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if _reset_daily_metrics_if_due(user):
        db.commit()
        db.refresh(user)

    pending_task = db.scalar(
        select(UserTask)
        .where(
            UserTask.user_id == payload.userId,
            UserTask.status.in_(["pending", "pending_debited"]),
        )
        .order_by(UserTask.created_at.desc())
    )
    if pending_task:
        combo_id = _extract_combo_id(pending_task.task_code)
        combo_products = _load_combo_items(db, [combo_id]).get(combo_id, []) if combo_id else []
        raise HTTPException(
            status_code=409,
            detail={
                "code": "PENDING_TASK_EXISTS",
                "message": "You have a pending task. Submit it before starting another one.",
                "task": _format_task_record(pending_task, combo_products),
                "supportUrl": _get_support_chat_url(db),
            },
        )

    cfg = _VIP_CONFIG.get(user.vip_level, {"tasks_per_set": 60, "rate": 0.09})
    rate = cfg["rate"]

    combo = db.scalar(
        select(Combo).where(
            Combo.user_id == payload.userId,
            Combo.task_number == payload.currentTaskNumber,
            Combo.status == "Pending",
        )
    )

    if combo:
        combo.status = "Triggered"
        combo_items = _load_combo_items(db, [combo.id]).get(combo.id, [])
        if not combo_items:
            base_product = db.get(Product, combo.product_id)
            if not base_product:
                raise HTTPException(status_code=404, detail="Combo product not found")
            combo_items = [
                {
                    "id": None,
                    "product_id": base_product.id,
                    "product_name": base_product.name,
                    "price": float(base_product.price),
                    "commission": round(float(base_product.price) * rate, 2),
                }
            ]

        first_product = db.get(Product, combo_items[0]["product_id"])
        total_price = round(sum(float(item["price"]) for item in combo_items), 2)
        total_commission = round(sum(float(item["commission"]) for item in combo_items), 2)
        task_code = f"CMB-{combo.id}-{secrets.token_hex(3).upper()}"

        user_task = UserTask(
            user_id=payload.userId,
            product_id=combo.product_id,
            product_name=" + ".join([item["product_name"] for item in combo_items]),
            image_url=first_product.image_url if first_product else None,
            amount=total_price,
            commission=total_commission,
            commission_rate=0,
            task_code=task_code,
            status="pending",
        )
        db.add(user_task)
        db.commit()
        db.refresh(user_task)
        return {
            "success": True,
            "isCombo": True,
            "task": _format_task_record(user_task, combo_items),
            "combo": {
                "id": combo.id,
                "task_number": combo.task_number,
                "status": combo.status,
                "products": combo_items,
                "total_price": total_price,
                "total_commission": total_commission,
            },
            "supportUrl": _get_support_chat_url(db),
            "message": "Combo triggered. Submit this task to continue.",
        }

    product = _pick_random_product_for_balance(db, float(user.balance or 0))
    if not product:
        raise HTTPException(
            status_code=400,
            detail="No active products are available below your current balance.",
        )

    commission = round(float(product.price) * rate, 2)
    task_code = f"TSK-{secrets.token_hex(4).upper()}"
    user_task = UserTask(
        user_id=payload.userId,
        product_id=product.id,
        product_name=product.name,
        image_url=product.image_url,
        amount=float(product.price),
        commission=commission,
        commission_rate=rate * 100,
        task_code=task_code,
        status="pending",
    )
    db.add(user_task)
    db.commit()
    db.refresh(user_task)

    return {
        "success": True,
        "isCombo": False,
        "task": _format_task_record(user_task),
        "supportUrl": _get_support_chat_url(db),
    }


@router.get("/combos")
def get_combos(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Combo, User.username, Product.name, Product.price)
        .join(User, Combo.user_id == User.id)
        .join(Product, Combo.product_id == Product.id)
        .order_by(Combo.id)
    ).all()

    combo_ids = [combo.id for combo, _, _, _ in rows]
    combo_items_map = _load_combo_items(db, combo_ids)

    result = []
    for combo, username, product_name, price in rows:
        products = combo_items_map.get(combo.id)
        if not products:
            base_product = db.get(Product, combo.product_id)
            products = [
                {
                    "id": None,
                    "product_id": combo.product_id,
                    "product_name": product_name,
                    "price": price,
                    "commission": float(base_product.commission_rate) if base_product else 0.0,
                }
            ]

        result.append(
            {
                **_to_dict(combo),
                "username": username,
                "product_name": ", ".join([item["product_name"] for item in products]),
                "price": round(sum(float(item["price"]) for item in products), 2),
                "products": products,
            }
        )

    return result


@router.post("/combos")
def create_combo(payload: ComboCreateRequest, request: Request, db: Session = Depends(get_db)):
    if len(payload.products) != 2:
        raise HTTPException(status_code=400, detail="Combo must contain exactly 2 products")

    product_ids = [item.productId for item in payload.products]
    if len(set(product_ids)) != 2:
        raise HTTPException(status_code=400, detail="Combo products must be different")

    for product_id in product_ids:
        if not db.get(Product, product_id):
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

    combo = Combo(user_id=payload.userId, task_number=payload.taskNumber, product_id=payload.products[0].productId)
    db.add(combo)
    db.flush()

    for item in payload.products:
        db.add(
            ComboItem(
                combo_id=combo.id,
                product_id=item.productId,
                custom_price=item.price,
                custom_commission=item.commission,
            )
        )

    _log_action(
        db,
        request,
        "Assigned Combo",
        f"User ID: {payload.userId}",
        f"Assigned 2 products on Task {payload.taskNumber}",
    )
    db.commit()
    return {"success": True}


@router.put("/combos/{combo_id}")
def update_combo(combo_id: int, payload: ComboUpdateRequest, request: Request, db: Session = Depends(get_db)):
    combo = db.get(Combo, combo_id)
    if not combo:
        raise HTTPException(status_code=404, detail="Combo not found")

    updates = payload.model_dump(exclude_none=True)
    if "userId" in updates:
        combo.user_id = updates.pop("userId")
    if "taskNumber" in updates:
        combo.task_number = updates.pop("taskNumber")
    combo_products = updates.pop("products", None)
    for key, value in updates.items():
        setattr(combo, key, value)

    if combo_products is not None:
        if len(combo_products) != 2:
            raise HTTPException(status_code=400, detail="Combo must contain exactly 2 products")

        product_ids = [item.productId for item in combo_products]
        if len(set(product_ids)) != 2:
            raise HTTPException(status_code=400, detail="Combo products must be different")

        for product_id in product_ids:
            if not db.get(Product, product_id):
                raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

        combo.product_id = combo_products[0].productId
        db.execute(delete(ComboItem).where(ComboItem.combo_id == combo_id))
        for item in combo_products:
            db.add(
                ComboItem(
                    combo_id=combo.id,
                    product_id=item.productId,
                    custom_price=item.price,
                    custom_commission=item.commission,
                )
            )

    _log_action(db, request, "Updated Combo", f"Combo ID: {combo_id}", str(payload.model_dump(exclude_none=True)))
    db.commit()
    return {"success": True}


@router.delete("/combos/{combo_id}")
def delete_combo(combo_id: int, request: Request, db: Session = Depends(get_db)):
    combo = db.get(Combo, combo_id)
    if not combo:
        raise HTTPException(status_code=404, detail="Combo not found")

    db.execute(delete(ComboItem).where(ComboItem.combo_id == combo_id))
    db.delete(combo)
    _log_action(db, request, "Deleted Combo", f"Combo ID: {combo_id}", "Combo removed")
    db.commit()
    return {"success": True}


@router.post("/combos/{combo_id}/reset")
def reset_combo(combo_id: int, request: Request, db: Session = Depends(get_db)):
    combo = db.get(Combo, combo_id)
    if not combo:
        raise HTTPException(status_code=404, detail="Combo not found")

    combo.status = "Pending"
    combo_prefix = f"CMB-{combo_id}-%"
    pending_tasks = db.scalars(
        select(UserTask).where(
            UserTask.user_id == combo.user_id,
            UserTask.task_code.like(combo_prefix),
            UserTask.status.in_(["pending", "pending_debited"]),
        )
    ).all()

    refunded = 0.0
    user = db.get(User, combo.user_id)
    for task in pending_tasks:
        if task.status == "pending_debited" and user:
            refunded += float(task.amount)
        db.delete(task)

    if user and refunded > 0:
        user.balance = round(float(user.balance) + refunded, 2)

    _log_action(
        db,
        request,
        "Reset Combo",
        f"Combo ID: {combo_id}",
        f"Removed {len(pending_tasks)} pending records and refunded {refunded:.2f}",
    )
    db.commit()
    return {"success": True, "removedPending": len(pending_tasks), "refunded": round(refunded, 2)}


@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db)):
    notifications = db.scalars(select(Notification).order_by(Notification.created_at.desc())).all()
    return [_to_dict(item) for item in notifications]


@router.post("/notifications")
def create_notification(payload: NotificationCreateRequest, request: Request, db: Session = Depends(get_db)):
    notification = Notification(
        title=payload.title,
        message=payload.message,
        status=payload.status,
        recipients=payload.recipients,
    )
    db.add(notification)
    db.flush()
    _log_action(db, request, "Created Notification", f"Notification ID: {notification.id}", payload.title)
    db.commit()
    return {"success": True, "notification": _to_dict(notification)}


@router.put("/notifications/{notification_id}")
def update_notification(
    notification_id: int,
    payload: NotificationUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    updates = payload.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(notification, key, value)

    _log_action(db, request, "Updated Notification", f"Notification ID: {notification_id}", str(updates))
    db.commit()
    return {"success": True}


@router.delete("/notifications/{notification_id}")
def delete_notification(notification_id: int, request: Request, db: Session = Depends(get_db)):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    db.delete(notification)
    _log_action(db, request, "Deleted Notification", f"Notification ID: {notification_id}", notification.title)
    db.commit()
    return {"success": True}


@router.get("/withdrawals")
def get_withdrawals(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Withdrawal, User.username)
        .join(User, Withdrawal.user_id == User.id)
        .order_by(Withdrawal.id)
    ).all()

    return [{**_to_dict(withdrawal), "username": username} for withdrawal, username in rows]


@router.post("/withdrawals/{withdrawal_id}/approve")
def approve_withdrawal(withdrawal_id: int, request: Request, db: Session = Depends(get_db)):
    withdrawal = db.get(Withdrawal, withdrawal_id)
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    if withdrawal.status != "Pending":
        raise HTTPException(status_code=400, detail="Withdrawal is not pending")

    db_user = db.get(User, withdrawal.user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_user.balance = float(db_user.balance) - float(withdrawal.amount)
    withdrawal.status = "Approved"
    _log_action(
        db,
        request,
        "Approved Withdrawal",
        f"User ID: {withdrawal.user_id}",
        f"Approved W-{withdrawal_id} (${withdrawal.amount})",
    )
    db.commit()
    return {"success": True}


@router.post("/withdrawals/{withdrawal_id}/reject")
def reject_withdrawal(withdrawal_id: int, request: Request, db: Session = Depends(get_db)):
    withdrawal = db.get(Withdrawal, withdrawal_id)
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    if withdrawal.status != "Pending":
        raise HTTPException(status_code=400, detail="Withdrawal is not pending")

    withdrawal.status = "Rejected"
    _log_action(
        db,
        request,
        "Rejected Withdrawal",
        f"User ID: {withdrawal.user_id}",
        f"Rejected W-{withdrawal_id} (${withdrawal.amount})",
    )
    db.commit()
    return {"success": True}


@router.get("/settings")
def get_settings(db: Session = Depends(get_db)):
    settings = db.scalars(select(Setting).order_by(Setting.key)).all()
    return [_to_dict(setting) for setting in settings]


@router.post("/settings")
def update_setting(payload: SettingUpdateRequest, db: Session = Depends(get_db)):
    setting = db.get(Setting, payload.key)
    if not setting:
        setting = Setting(key=payload.key, value=payload.value)
        db.add(setting)
    else:
        setting.value = payload.value
    db.commit()
    return {"success": True}


@router.post("/settings/bulk")
def update_settings_bulk(payload: SettingsBulkUpdateRequest, db: Session = Depends(get_db)):
    for item in payload.settings:
        setting = db.get(Setting, item.key)
        if not setting:
            setting = Setting(key=item.key, value=item.value)
            db.add(setting)
        else:
            setting.value = item.value
    db.commit()
    return {"success": True}


@router.get("/logs")
def get_logs(db: Session = Depends(get_db)):
    logs = db.scalars(select(ActivityLog).order_by(ActivityLog.created_at.desc())).all()
    return [_to_dict(log) for log in logs]


@router.get("/transactions")
def get_transactions(db: Session = Depends(get_db)):
    logs = db.scalars(
        select(ActivityLog)
        .where(
            ActivityLog.action.in_(
                [
                    "Added Balance",
                    "Deducted Balance",
                    "Approved Withdrawal",
                    "Rejected Withdrawal",
                    "Training Commission Credit",
                ]
            )
        )
        .order_by(ActivityLog.created_at.desc())
    ).all()

    transactions = []
    for log in logs:
        amount = 0.0
        for token in log.details.replace("(", " ").replace(")", " ").split():
            if token.startswith("$"):
                try:
                    amount = float(token.replace("$", "").replace(",", ""))
                    break
                except ValueError:
                    continue

        tx_type = "Credit" if log.action in ["Added Balance", "Rejected Withdrawal", "Training Commission Credit"] else "Debit"
        status = "Completed" if log.action in ["Added Balance", "Approved Withdrawal", "Training Commission Credit"] else "Processed"

        transactions.append(
            {
                "id": log.id,
                "user": log.target,
                "type": tx_type,
                "amount": amount,
                "status": status,
                "date": log.created_at,
                "reference": log.action,
                "details": log.details,
            }
        )

    return transactions


@router.get("/tracked-clicks")
def get_tracked_clicks(db: Session = Depends(get_db)):
    users = db.scalars(select(User).order_by(User.id)).all()
    data = []
    for index, user in enumerate(users, start=1):
        clicks = 30 + (index * 17)
        conversions = max(1, clicks // 8)
        data.append(
            {
                "id": index,
                "username": user.username,
                "campaign": f"CMP-{1000 + index}",
                "clicks": clicks,
                "conversions": conversions,
                "conversion_rate": round((conversions / clicks) * 100, 2),
                "last_click_at": user.created_at,
            }
        )
    return data


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_products = db.scalar(select(func.count(Product.id))) or 0
    total_tasks = db.scalar(select(func.count(Task.id))) or 0
    total_combos = db.scalar(select(func.count(Combo.id))) or 0
    total_withdrawals = db.scalar(select(func.count(Withdrawal.id))) or 0
    total_logs = db.scalar(select(func.count(ActivityLog.id))) or 0

    vip_rows = db.execute(
        select(User.vip_level, func.count(User.id)).group_by(User.vip_level).order_by(User.vip_level)
    ).all()
    vip_distribution = [{"name": vip_level, "users": users_count} for vip_level, users_count in vip_rows]

    recent_activity = db.scalars(select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(5)).all()

    return {
        "stats": {
            "totalUsers": total_users,
            "totalProducts": total_products,
            "totalTasks": total_tasks,
            "totalCombos": total_combos,
            "totalWithdrawals": total_withdrawals,
            "totalLogs": total_logs,
        },
        "vipDistribution": vip_distribution,
        "recentActivity": [_to_dict(log) for log in recent_activity],
    }


# ── Client-facing auth & task endpoints ──────────────────────────────────────

@router.post("/auth/login")
def client_login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == body.username))
    if not user or user.login_password != body.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if _reset_daily_metrics_if_due(user):
        db.commit()
        db.refresh(user)

    user_payload = _serialize_user(user)
    user_payload["access_token"] = create_access_token(user.id)
    user_payload["token_type"] = "bearer"
    return user_payload


@router.get("/users/{user_id}/overview")
def client_user_overview(user_id: int, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if _reset_daily_metrics_if_due(user):
        db.commit()
        db.refresh(user)
    return _serialize_user(user)


_VIP_CONFIG = {
    1: {"tasks_per_set": 40, "rate": 0.09},
    2: {"tasks_per_set": 45, "rate": 0.09},
    3: {"tasks_per_set": 50, "rate": 0.09},
    4: {"tasks_per_set": 55, "rate": 0.09},
}


@router.get("/users/{user_id}/pending-tasks")
def client_pending_tasks(user_id: int, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if _reset_daily_metrics_if_due(user):
        db.commit()
        db.refresh(user)

    tasks = db.scalars(
        select(UserTask)
        .where(
            UserTask.user_id == user_id,
            UserTask.status.in_(["pending", "pending_debited"]),
        )
        .order_by(UserTask.created_at.desc())
    ).all()

    result = []
    for task in tasks:
        combo_id = _extract_combo_id(task.task_code)
        combo_products = _load_combo_items(db, [combo_id]).get(combo_id, []) if combo_id else []
        result.append(_format_task_record(task, combo_products))
    return {
        "tasks": result,
        "supportUrl": _get_support_chat_url(db),
    }


@router.post("/users/{user_id}/submit-task")
def client_submit_task(user_id: int, body: SubmitTaskRequest, request: Request, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if _reset_daily_metrics_if_due(user):
        db.commit()
        db.refresh(user)

    user_task = db.scalar(
        select(UserTask).where(UserTask.user_id == user_id, UserTask.task_code == body.taskCode)
    )
    if not user_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if user_task.status == "completed":
        return {
            "success": True,
            "task_record": _to_dict(user_task),
            "user": _serialize_user(user),
        }

    if user_task.status not in ["pending", "pending_debited"]:
        raise HTTPException(status_code=400, detail="Task is not pending")

    cfg = _VIP_CONFIG.get(user.vip_level, {"tasks_per_set": 60, "rate": 0.09})
    tasks_per_set = cfg["tasks_per_set"]
    support_url = _get_support_chat_url(db)

    if user_task.status == "pending" and float(user.balance) < float(user_task.amount):
        user.balance = round(float(user.balance) - float(user_task.amount), 2)
        user_task.status = "pending_debited"
        db.commit()
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INSUFFICIENT_BALANCE",
                "message": "Task amount is higher than your balance. Please deposit and contact support.",
                "requiredDeposit": round(abs(float(user.balance)), 2),
                "supportUrl": support_url,
                "task": _to_dict(user_task),
            },
        )

    if user_task.status == "pending_debited":
        if float(user.balance) < 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "INSUFFICIENT_BALANCE",
                    "message": "Your balance is negative. Please deposit and contact support.",
                    "requiredDeposit": round(abs(float(user.balance)), 2),
                    "supportUrl": support_url,
                    "task": _to_dict(user_task),
                },
            )
        user.balance = round(float(user.balance) + float(user_task.amount) + float(user_task.commission), 2)
    else:
        user.balance = round(float(user.balance) + float(user_task.commission), 2)

    user_task.status = "completed"
    commission = float(user_task.commission)
    combo_id = _extract_combo_id(user_task.task_code)
    if combo_id:
        combo = db.get(Combo, combo_id)
        if combo and combo.status != "Completed":
            combo.status = "Completed"

    user.tasks_completed_in_set = (user.tasks_completed_in_set or 0) + 1
    user.task_count_today = (user.task_count_today or 0) + 1
    user.commission = round(float(user.commission) + commission, 2)
    user.commission_today = round(float(user.commission_today) + commission, 2)

    if user.tasks_completed_in_set >= tasks_per_set:
        user.tasks_completed_in_set = 0
        user.current_set = (user.current_set or 0) + 1

    _log_action(
        db,
        request,
        "Complete Task",
        f"User #{user_id}",
        f"Task: {user_task.task_code}, Amount: {user_task.amount}, Commission: {commission}",
    )
    db.commit()
    db.refresh(user_task)

    return {
        "success": True,
        "commission": commission,
        "task_record": _to_dict(user_task),
        "user": _serialize_user(user),
    }


@router.get("/users/{user_id}/task-records")
def client_task_records(user_id: int, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    records = db.scalars(
        select(UserTask).where(UserTask.user_id == user_id).order_by(UserTask.created_at.desc())
    ).all()
    result = []
    for record in records:
        combo_id = _extract_combo_id(record.task_code)
        combo_products = _load_combo_items(db, [combo_id]).get(combo_id, []) if combo_id else []
        result.append(_format_task_record(record, combo_products))
    return result


@router.post("/translate", response_model=TranslateBatchResponse)
def translate_batch(payload: TranslateBatchRequest):
    texts = payload.texts or []
    if len(texts) == 0:
        return TranslateBatchResponse(translated_texts=[], target_language=payload.target_language)
    if len(texts) > 200:
        raise HTTPException(status_code=400, detail="A maximum of 200 texts is allowed")
    if not payload.target_language or not payload.target_language.strip():
        raise HTTPException(status_code=400, detail="target_language is required")

    normalized_target = payload.target_language.strip().lower()
    normalized_source = (payload.source_language or "auto").strip().lower() or "auto"

    if normalized_target != "auto" and not re.fullmatch(r"[a-z]{2,3}(?:-[a-z]{2})?", normalized_target):
        raise HTTPException(status_code=400, detail="Invalid target_language format")
    if normalized_source != "auto" and not re.fullmatch(r"[a-z]{2,3}(?:-[a-z]{2})?", normalized_source):
        raise HTTPException(status_code=400, detail="Invalid source_language format")

    safe_texts: list[str] = []
    for text in texts:
        coerced = str(text)
        if len(coerced) > 1000:
            raise HTTPException(status_code=400, detail="Each text must be 1000 characters or less")
        safe_texts.append(coerced)

    translated_texts = _batch_translate_texts(
        texts=safe_texts,
        source_language=normalized_source,
        target_language=normalized_target,
    )

    return TranslateBatchResponse(
        translated_texts=translated_texts,
        target_language=normalized_target,
    )
