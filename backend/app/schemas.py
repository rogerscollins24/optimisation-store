from pydantic import BaseModel


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
    status: str = "Active"


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
    status: str | None = None


class ProductCreateRequest(BaseModel):
    name: str
    description: str | None = None
    price: float
    commission_rate: float
    stock: int
    status: str = "Active"


class ProductUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
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
