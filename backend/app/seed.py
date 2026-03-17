from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import ActivityLog, Product, Setting, Task, User, Withdrawal


def seed_if_empty(db: Session) -> None:
    user_count = db.scalar(select(User.id).limit(1))
    if user_count:
        return

    users = [
        User(username="john_doe", email="john@example.com", phone="+1234567890", balance=500.00, vip_level=2, status="Active"),
        User(username="jane_smith", email="jane@example.com", phone="+0987654321", balance=1250.00, vip_level=4, status="Active"),
    ]
    db.add_all(users)
    db.flush()

    products = [
        Product(name="Premium Wireless Headphones", price=299.99, commission_rate=10, stock=150, status="Active"),
        Product(name="Smart Fitness Watch", price=149.50, commission_rate=15, stock=85, status="Active"),
        Product(name="Luxury Gold Watch", price=5500.00, commission_rate=5, stock=10, status="Active"),
    ]
    db.add_all(products)

    tasks = [
        Task(title="Complete Product Review", description="Submit a verified review for assigned product", reward=12.5, type="Review", status="Active", completions=0),
        Task(title="Share Product Link", description="Share referral link and track click-through", reward=5.0, type="Referral", status="Active", completions=0),
    ]
    db.add_all(tasks)

    settings = [
        Setting(key="maintenance_mode", value="false"),
        Setting(key="global_withdrawal_lock", value="false"),
        Setting(key="require_withdrawal_pin", value="true"),
    ]
    db.add_all(settings)

    withdrawals = [
        Withdrawal(user_id=users[0].id, amount=75.0, method="USDT", address="TRX9ExampleWallet", status="Pending"),
        Withdrawal(user_id=users[1].id, amount=120.0, method="Bank", address="****2345", status="Approved"),
    ]
    db.add_all(withdrawals)

    db.add(
        ActivityLog(
            admin="Super Admin",
            action="Seed Data",
            target="System",
            details="Initialized fresh Postgres dataset",
            ip="127.0.0.1",
        )
    )
    db.commit()
