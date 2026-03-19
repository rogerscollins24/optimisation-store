from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import ActivityLog, Notification, Product, Setting, Task, User, UserTask, Withdrawal


def seed_if_empty(db: Session) -> None:
    user_count = db.scalar(select(User.id).limit(1))
    if user_count:
        return

    users = [
        User(username="john_doe", email="john@example.com", phone="+1234567890", login_password="pass123", withdraw_password="wd123", balance=500.00, vip_level=2, invite_code="INV000001", status="Active"),
        User(username="jane_smith", email="jane@example.com", phone="+0987654321", login_password="pass456", withdraw_password="wd456", balance=1250.00, vip_level=4, invite_code="INV000002", status="Active"),
    ]
    db.add_all(users)
    db.flush()

    product_data = [
        ("Premium Wireless Headphones", 299.99),
        ("Smart Fitness Watch", 149.50),
        ("Luxury Gold Watch", 5500.00),
        ("Diamond Ring", 2400.00),
        ("Running Shoes", 120.50),
        ("Wireless Earbuds", 199.99),
        ("Smart Phone", 899.00),
        ("Laptop Stand", 49.99),
        ("Mechanical Keyboard", 159.00),
        ("Monitor 4K", 699.00),
        ("Gaming Mouse", 89.99),
        ("Webcam HD", 75.00),
        ("USB-C Hub", 45.00),
        ("Portable Speaker", 129.00),
        ("Sunglasses", 250.00),
        ("Leather Wallet", 89.00),
        ("Perfume Bottle", 320.00),
        ("Coffee Maker", 199.00),
        ("Air Purifier", 399.00),
        ("Robot Vacuum", 549.00),
        ("Electric Toothbrush", 69.99),
        ("Yoga Mat", 55.00),
        ("Protein Powder", 44.99),
        ("Resistance Bands Set", 29.99),
        ("Foam Roller", 35.00),
        ("Hiking Backpack", 145.00),
        ("Tent 2-Person", 289.00),
        ("Sleeping Bag", 119.00),
        ("Water Bottle", 39.99),
        ("Sunscreen SPF50", 22.99),
        ("Wireless Charger", 34.99),
        ("Car Phone Holder", 19.99),
        ("Dash Cam", 99.99),
        ("Neck Pillow", 29.99),
        ("Travel Adapter", 24.99),
        ("Scented Candle Set", 49.99),
        ("Bath Bomb Set", 39.99),
        ("Face Serum", 79.99),
        ("Hair Dryer", 59.99),
        ("Electric Shaver", 79.00),
    ]
    products = []
    for name, price in product_data:
        slug = name.lower().replace(" ", "-")
        products.append(Product(
            name=name,
            price=price,
            commission_rate=1.0,
            stock=100,
            status="Active",
            image_url=f"https://picsum.photos/seed/{slug}/300/300",
        ))
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

    notifications = [
        Notification(
            title="Working time",
            message="Customer service hours are from 10:00 AM to 10:00 PM daily.",
            status="Active",
            recipients="all",
        ),
        Notification(
            title="Withdrawal window",
            message="Pending withdrawal requests are reviewed during operating hours.",
            status="Active",
            recipients="all",
        ),
    ]
    db.add_all(notifications)

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
