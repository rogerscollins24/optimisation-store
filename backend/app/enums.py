from enum import StrEnum


class UserRole(StrEnum):
    MERCHANT = "merchant"
    SUPER_ADMIN = "super_admin"
    FINANCE = "finance"
    OPS = "ops"
    SUPPORT = "support"


class SupportTicketStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
