from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .enums import SupportTicketStatus, UserRole


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
    last_commission_reset: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
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
    role: Mapped[str] = mapped_column(String, default=UserRole.MERCHANT.value, index=True)
    created_by_admin_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    managed_by_admin_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    support_tickets = relationship("SupportTicket", back_populates="user", foreign_keys="SupportTicket.user_id")
    assigned_support_tickets = relationship(
        "SupportTicket",
        back_populates="assigned_admin",
        foreign_keys="SupportTicket.assigned_to_admin_id",
    )
    support_messages = relationship("SupportMessage", back_populates="sender")
    created_users = relationship(
        "User",
        back_populates="created_by_admin",
        foreign_keys="User.created_by_admin_id",
    )
    created_by_admin = relationship(
        "User",
        back_populates="created_users",
        remote_side="User.id",
        foreign_keys=[created_by_admin_id],
    )
    managed_users = relationship(
        "User",
        back_populates="managed_by_admin",
        foreign_keys="User.managed_by_admin_id",
    )
    managed_by_admin = relationship(
        "User",
        back_populates="managed_users",
        remote_side="User.id",
        foreign_keys=[managed_by_admin_id],
    )


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
    assigned_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


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
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    admin: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(String)
    target: Mapped[str] = mapped_column(String)
    details: Mapped[str] = mapped_column(Text)
    ip: Mapped[str] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


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
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


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
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_to_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32), default=SupportTicketStatus.OPEN.value, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="support_tickets", foreign_keys=[user_id])
    assigned_admin = relationship("User", back_populates="assigned_support_tickets", foreign_keys=[assigned_to_admin_id])
    messages = relationship("SupportMessage", back_populates="ticket", cascade="all, delete-orphan")


class SupportMessage(Base):
    __tablename__ = "support_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ticket_id: Mapped[int] = mapped_column(ForeignKey("support_tickets.id", ondelete="CASCADE"), index=True)
    sender_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content: Mapped[str] = mapped_column(Text)
    is_admin_reply: Mapped[bool] = mapped_column(Boolean, default=False)
    read_by_admin: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_by_user: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    ticket = relationship("SupportTicket", back_populates="messages")
    sender = relationship("User", back_populates="support_messages")
