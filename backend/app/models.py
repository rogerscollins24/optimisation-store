from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String, unique=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    login_password: Mapped[str | None] = mapped_column(String, nullable=True)
    withdraw_password: Mapped[str | None] = mapped_column(String, nullable=True)
    gender: Mapped[str | None] = mapped_column(String, nullable=True)
    balance: Mapped[float] = mapped_column(Float, default=0)
    commission: Mapped[float] = mapped_column(Float, default=0)
    commission_today: Mapped[float] = mapped_column(Float, default=0)
    last_commission_reset: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
    vip_level: Mapped[int] = mapped_column(Integer, default=1)
    invite_code: Mapped[str | None] = mapped_column(String, nullable=True)
    referred_by: Mapped[str | None] = mapped_column(String, nullable=True)
    current_set: Mapped[int] = mapped_column(Integer, default=0)
    task_count_today: Mapped[int] = mapped_column(Integer, default=0)
    tasks_completed_in_set: Mapped[int] = mapped_column(Integer, default=0)
    set_starting_balance: Mapped[float] = mapped_column(Float, default=0)
    exchange: Mapped[str | None] = mapped_column(String, nullable=True)
    wallet_address: Mapped[str | None] = mapped_column(String, nullable=True)
    is_training_account: Mapped[bool] = mapped_column(Boolean, default=False)
    trainer_owner_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    training_commission_rate: Mapped[float] = mapped_column(Float, default=25.0)
    status: Mapped[str] = mapped_column(String, default="Active")
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Float)
    commission_rate: Mapped[float] = mapped_column(Float)
    stock: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String, default="Active")
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    reward: Mapped[float] = mapped_column(Float)
    type: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="Active")
    completions: Mapped[int] = mapped_column(Integer, default=0)


class Combo(Base):
    __tablename__ = "combos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    task_number: Mapped[int] = mapped_column(Integer)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"))
    status: Mapped[str] = mapped_column(String, default="Pending")
    assigned_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())


class ComboItem(Base):
    __tablename__ = "combo_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    combo_id: Mapped[int] = mapped_column(Integer, ForeignKey("combos.id"))
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"))
    custom_price: Mapped[float] = mapped_column(Float)
    custom_commission: Mapped[float] = mapped_column(Float)


class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    amount: Mapped[float] = mapped_column(Float)
    method: Mapped[str] = mapped_column(String)
    address: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="Pending")
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    target: Mapped[str] = mapped_column(String)
    details: Mapped[str] = mapped_column(Text)
    ip: Mapped[str] = mapped_column(String)
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(String)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String)
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="Active")
    recipients: Mapped[str] = mapped_column(Text, default="all")


class UserTask(Base):
    __tablename__ = "user_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    product_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("products.id"), nullable=True)
    product_name: Mapped[str] = mapped_column(String)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    amount: Mapped[float] = mapped_column(Float)
    commission: Mapped[float] = mapped_column(Float)
    commission_rate: Mapped[float] = mapped_column(Float)
    task_code: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="completed")
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())
