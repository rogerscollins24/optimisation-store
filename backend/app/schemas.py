from datetime import datetime

from pydantic import BaseModel

from .enums import SupportTicketStatus, UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    id: int
    username: str
    email: str | None = None
    phone: str | None = None
    balance: float = 0
    commission_today: float = 0
    vip_level: int = 1
    invite_code: str | None = None
    credit_score: int = 100
    tasks_completed_in_set: int = 0
    task_count_today: int = 0
    withdraw_password: str | None = None
    access_token: str
    token_type: str = "bearer"


class CompleteTaskRequest(BaseModel):
    product_id: int | None = None


class BalanceUpdateRequest(BaseModel):
    amount: float
    type: str
    reason: str = ""


class ComboProductConfig(BaseModel):
    productId: int
    price: float
    commission: float


class ComboCreateRequest(BaseModel):
    userId: int
    taskNumber: int
    products: list[ComboProductConfig]


class TaskStartRequest(BaseModel):
    userId: int
    currentTaskNumber: int


class SubmitTaskRequest(BaseModel):
    taskCode: str


class SettingUpdateRequest(BaseModel):
    key: str
    value: str


class UserCreateRequest(BaseModel):
    username: str
    email: str | None = None
    phone: str | None = None
    login_password: str | None = None
    withdraw_password: str | None = None
    gender: str | None = None
    balance: float = 0
    commission: float = 0
    commission_today: float = 0
    last_commission_reset: str | None = None
    vip_level: int = 1
    invite_code: str | None = None
    referred_by: str | None = None
    current_set: int = 0
    task_count_today: int = 0
    tasks_completed_in_set: int = 0
    set_starting_balance: float = 0
    exchange: str | None = None
    wallet_address: str | None = None
    is_training_account: bool = False
    trainer_owner_id: int | None = None
    training_commission_rate: float = 25.0
    status: str = "Active"
    role: UserRole = UserRole.MERCHANT
    managed_by_admin_id: int | None = None


class UserUpdateRequest(BaseModel):
    username: str | None = None
    email: str | None = None
    phone: str | None = None
    login_password: str | None = None
    withdraw_password: str | None = None
    gender: str | None = None
    balance: float | None = None
    commission: float | None = None
    commission_today: float | None = None
    last_commission_reset: str | None = None
    vip_level: int | None = None
    invite_code: str | None = None
    referred_by: str | None = None
    current_set: int | None = None
    task_count_today: int | None = None
    tasks_completed_in_set: int | None = None
    set_starting_balance: float | None = None
    exchange: str | None = None
    wallet_address: str | None = None
    is_training_account: bool | None = None
    trainer_owner_id: int | None = None
    training_commission_rate: float | None = None
    status: str | None = None
    role: UserRole | None = None
    managed_by_admin_id: int | None = None


class TrainingAccountCreateRequest(BaseModel):
    username: str
    phone: str | None = None
    login_password: str
    withdraw_password: str
    invite_code: str | None = None
    referred_by: str


class ProductCreateRequest(BaseModel):
    name: str
    description: str | None = None
    image_url: str | None = None
    price: float
    commission_rate: float
    stock: int
    status: str = "Active"


class ProductUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    image_url: str | None = None
    price: float | None = None
    commission_rate: float | None = None
    stock: int | None = None
    status: str | None = None


class TaskCreateRequest(BaseModel):
    title: str
    description: str
    reward: float
    type: str
    status: str = "Active"


class TaskUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    reward: float | None = None
    type: str | None = None
    status: str | None = None


class ComboUpdateRequest(BaseModel):
    userId: int | None = None
    taskNumber: int | None = None
    products: list[ComboProductConfig] | None = None
    status: str | None = None


class SettingsBulkUpdateRequest(BaseModel):
    settings: list[SettingUpdateRequest]


class NotificationCreateRequest(BaseModel):
    title: str
    message: str
    status: str = "Active"
    recipients: str = "all"


class NotificationUpdateRequest(BaseModel):
    title: str | None = None
    message: str | None = None
    status: str | None = None
    recipients: str | None = None


class SupportMessageCreate(BaseModel):
    content: str


class SupportMessageSchema(BaseModel):
    id: int
    ticket_id: int
    sender_id: int | None = None
    content: str
    is_admin_reply: bool
    read_by_admin: bool
    read_by_user: bool
    created_at: datetime

    class Config:
        from_attributes = True


class SupportTicketCreate(BaseModel):
    subject: str
    message: str


class SupportTicketUpdate(BaseModel):
    status: SupportTicketStatus | None = None


class SupportTicketAssignmentUpdate(BaseModel):
    assigned_to_admin_id: int | None = None


class SupportTicketSchema(BaseModel):
    id: int
    user_id: int | None = None
    assigned_to_admin_id: int | None = None
    subject: str
    status: SupportTicketStatus
    created_at: datetime
    updated_at: datetime
    user_username: str | None = None
    user_email: str | None = None
    assigned_admin_username: str | None = None
    messages: list[SupportMessageSchema] = []

    class Config:
        from_attributes = True
