import random

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from .database import get_db
from .models import ActivityLog, Combo, Product, Setting, Task, User, Withdrawal
from .schemas import (
    BalanceUpdateRequest,
    ComboCreateRequest,
    ComboUpdateRequest,
    ProductCreateRequest,
    ProductUpdateRequest,
    SettingsBulkUpdateRequest,
    SettingUpdateRequest,
    TaskCreateRequest,
    TaskStartRequest,
    TaskUpdateRequest,
    UserCreateRequest,
    UserUpdateRequest,
)

router = APIRouter()


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
        balance=payload.balance,
        vip_level=payload.vip_level,
        status=payload.status,
    )
    db.add(user)
    db.flush()
    _log_action(db, request, "Created User", f"User ID: {user.id}", f"Created {user.username}")
    db.commit()
    return {"success": True, "user": _to_dict(user)}


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

    return [
        {
            **_to_dict(combo),
            "username": username,
            "product_name": product_name,
            "price": price,
        }
        for combo, username, product_name, price in rows
    ]


@router.post("/combos")
def create_combo(payload: ComboCreateRequest, request: Request, db: Session = Depends(get_db)):
    combo = Combo(user_id=payload.userId, task_number=payload.taskNumber, product_id=payload.productId)
    db.add(combo)
    _log_action(
        db,
        request,
        "Assigned Combo",
        f"User ID: {payload.userId}",
        f"Assigned Product ID: {payload.productId} on Task {payload.taskNumber}",
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
    if "productId" in updates:
        combo.product_id = updates.pop("productId")
    for key, value in updates.items():
        setattr(combo, key, value)

    _log_action(db, request, "Updated Combo", f"Combo ID: {combo_id}", str(payload.model_dump(exclude_none=True)))
    db.commit()
    return {"success": True}


@router.delete("/combos/{combo_id}")
def delete_combo(combo_id: int, request: Request, db: Session = Depends(get_db)):
    combo = db.get(Combo, combo_id)
    if not combo:
        raise HTTPException(status_code=404, detail="Combo not found")

    db.delete(combo)
    _log_action(db, request, "Deleted Combo", f"Combo ID: {combo_id}", "Combo removed")
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

        tx_type = "Credit" if log.action in ["Added Balance", "Rejected Withdrawal"] else "Debit"
        status = "Completed" if "Approved" in log.action or "Added" in log.action else "Processed"

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
