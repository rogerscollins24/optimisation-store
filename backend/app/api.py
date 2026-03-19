import random
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from .database import get_db
from .models import ActivityLog, Combo, ComboItem, Notification, Product, Setting, Task, User, UserTask, Withdrawal
from .schemas import (
    BalanceUpdateRequest,
    CompleteTaskRequest,
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
    TaskUpdateRequest,
    TrainingAccountCreateRequest,
    UserCreateRequest,
    UserUpdateRequest,
)

router = APIRouter()


def _generate_invite_code(db: Session, prefix: str = "INV") -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    for _ in range(20):
        candidate = f"{prefix}{''.join(random.choice(alphabet) for _ in range(6))}"
        exists = db.scalar(select(User.id).where(User.invite_code == candidate))
        if not exists:
            return candidate
    raise HTTPException(status_code=500, detail="Failed to generate unique invite code")


def _to_dict(model_obj, extra: dict | None = None) -> dict:
    result = {column.name: getattr(model_obj, column.name) for column in model_obj.__table__.columns}
    if extra:
        result.update(extra)
    return result


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


@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.scalars(select(User).order_by(User.id)).all()
    return [_to_dict(user) for user in users]


@router.post("/users")
def create_user(payload: UserCreateRequest, request: Request, db: Session = Depends(get_db)):
    duplicate = db.scalar(
        select(User).where(or_(User.username == payload.username, User.email == payload.email))
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Username or email already exists")

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
    )
    db.add(user)
    db.flush()
    _log_action(db, request, "Created User", f"User ID: {user.id}", f"Created {user.username}")
    db.commit()
    return {"success": True, "user": _to_dict(user)}


@router.post("/users/training-account")
def create_training_account(payload: TrainingAccountCreateRequest, request: Request, db: Session = Depends(get_db)):
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
def update_user(user_id: int, payload: UserUpdateRequest, request: Request, db: Session = Depends(get_db)):
    db_user = db.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = payload.model_dump(exclude_none=True)
    for key, value in updates.items():
        setattr(db_user, key, value)

    _log_action(db, request, "Updated User", f"User ID: {user_id}", str(updates))
    db.commit()
    return {"success": True}


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


@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    products = db.scalars(select(Product).order_by(Product.id)).all()
    return [_to_dict(product) for product in products]


@router.post("/products")
def create_product(payload: ProductCreateRequest, request: Request, db: Session = Depends(get_db)):
    product = Product(
        name=payload.name,
        description=payload.description,
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
    combo = db.scalar(
        select(Combo).where(
            Combo.user_id == payload.userId,
            Combo.task_number == payload.currentTaskNumber,
            Combo.status == "Pending",
        )
    )

    if combo:
        combo.status = "Triggered"
        product = db.get(Product, combo.product_id)
        db.commit()
        return {
            "success": True,
            "isCombo": True,
            "product": _to_dict(product) if product else None,
            "message": "Combo triggered! High-value product assigned.",
        }

    user = db.get(User, payload.userId)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    price_cap = float(user.balance) * 1.5 if user.balance else 100
    candidate_products = db.scalars(select(Product).where(Product.price <= price_cap)).all()
    product = random.choice(candidate_products) if candidate_products else None

    return {
        "success": True,
        "isCombo": False,
        "product": _to_dict(product) if product else None,
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
    return _to_dict(user)


@router.get("/users/{user_id}/overview")
def client_user_overview(user_id: int, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _to_dict(user)


_VIP_CONFIG = {
    1: {"tasks_per_set": 40, "rate": 0.005},
    2: {"tasks_per_set": 45, "rate": 0.010},
    3: {"tasks_per_set": 50, "rate": 0.015},
    4: {"tasks_per_set": 55, "rate": 0.020},
}


@router.post("/users/{user_id}/complete-task")
def client_complete_task(user_id: int, body: CompleteTaskRequest, request: Request, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cfg = _VIP_CONFIG.get(user.vip_level, {"tasks_per_set": 60, "rate": 0.025})
    rate = cfg["rate"]
    tasks_per_set = cfg["tasks_per_set"]

    # Pick a random product (or the requested one)
    if body.product_id:
        product = db.scalar(select(Product).where(Product.id == body.product_id, Product.status == "Active"))
    else:
        products = db.scalars(select(Product).where(Product.status == "Active")).all()
        product = random.choice(products) if products else None

    if not product:
        raise HTTPException(status_code=404, detail="No active products available")

    commission = round(product.price * rate, 2)
    task_code = f"T{secrets.token_hex(4).upper()}"

    user_task = UserTask(
        user_id=user_id,
        product_id=product.id,
        product_name=product.name,
        image_url=product.image_url,
        amount=product.price,
        commission=commission,
        commission_rate=rate * 100,
        task_code=task_code,
        status="completed",
    )
    db.add(user_task)

    # Update user stats
    user.balance = round(user.balance + product.price + commission, 2)
    user.commission = round(user.commission + commission, 2)
    user.commission_today = round(user.commission_today + commission, 2)
    user.tasks_completed_in_set = (user.tasks_completed_in_set or 0) + 1
    user.task_count_today = (user.task_count_today or 0) + 1

    if user.tasks_completed_in_set >= tasks_per_set:
        user.tasks_completed_in_set = 0
        user.current_set = (user.current_set or 0) + 1

    _log_action(db, request, "Complete Task", f"User #{user_id}", f"Product: {product.name}, Commission: {commission}")
    db.commit()
    db.refresh(user_task)

    return {
        "success": True,
        "commission": commission,
        "task_record": _to_dict(user_task),
        "user": _to_dict(user),
    }


@router.get("/users/{user_id}/task-records")
def client_task_records(user_id: int, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    records = db.scalars(
        select(UserTask).where(UserTask.user_id == user_id).order_by(UserTask.created_at.desc())
    ).all()
    return [_to_dict(r) for r in records]
