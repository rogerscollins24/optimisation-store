from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String, unique=True)
    email: Mapped[str] = mapped_column(String, unique=True)
    phone: Mapped[str] = mapped_column(String)
    balance: Mapped[float] = mapped_column(Float, default=0)
    vip_level: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String, default="Active")
    created_at: Mapped[DateTime] = mapped_column(DateTime, server_default=func.now())


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String)
    price: Mapped[float] = mapped_column(Float)
    commission_rate: Mapped[float] = mapped_column(Float)
    stock: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String, default="Active")


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
