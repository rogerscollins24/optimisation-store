from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from .config import settings
from .database import get_db
from .deps import get_current_user, require_roles
from .enums import SupportTicketStatus, UserRole
from .models import SupportMessage, SupportTicket, User
from .schemas import (
    SupportMessageCreate,
    SupportTicketAssignmentUpdate,
    SupportTicketCreate,
    SupportTicketSchema,
    SupportTicketUpdate,
)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, ticket_id: int, websocket: WebSocket):
        await websocket.accept()
        if ticket_id not in self.active_connections:
            self.active_connections[ticket_id] = []
        self.active_connections[ticket_id].append(websocket)

    async def disconnect(self, ticket_id: int, websocket: WebSocket):
        if ticket_id in self.active_connections and websocket in self.active_connections[ticket_id]:
            self.active_connections[ticket_id].remove(websocket)
            if not self.active_connections[ticket_id]:
                del self.active_connections[ticket_id]

    async def broadcast(self, ticket_id: int, payload: dict):
        if ticket_id not in self.active_connections:
            return

        disconnected: list[WebSocket] = []
        for connection in self.active_connections[ticket_id]:
            try:
                await connection.send_json(payload)
            except Exception:
                disconnected.append(connection)

        for connection in disconnected:
            await self.disconnect(ticket_id, connection)


router = APIRouter()
manager = ConnectionManager()


def _role_value(user: User) -> str:
    return user.role if isinstance(user.role, str) else str(user.role)


def _is_admin(user: User) -> bool:
    return _role_value(user) in [UserRole.SUPER_ADMIN.value, UserRole.SUB_ADMIN.value]


def _is_super_admin(user: User) -> bool:
    return _role_value(user) == UserRole.SUPER_ADMIN.value


def _sub_admin_ticket_filter(user: User):
    return or_(
        SupportTicket.assigned_to_admin_id == user.id,
        SupportTicket.user.has(
            or_(
                User.created_by_admin_id == user.id,
                User.managed_by_admin_id == user.id,
            )
        ),
    )


def _decorate_ticket(ticket: SupportTicket) -> SupportTicket:
    if ticket.user:
        setattr(ticket, "user_username", ticket.user.username)
        setattr(ticket, "user_email", ticket.user.email)
    if ticket.assigned_admin:
        setattr(ticket, "assigned_admin_username", ticket.assigned_admin.username)
    return ticket


def _can_access_ticket(ticket: SupportTicket, current_user: User) -> bool:
    if _is_super_admin(current_user):
        return True
    if _role_value(current_user) == UserRole.SUB_ADMIN.value:
        created_for_sub_admin = bool(
            ticket.user
            and (
                ticket.user.created_by_admin_id == current_user.id
                or ticket.user.managed_by_admin_id == current_user.id
            )
        )
        return ticket.assigned_to_admin_id == current_user.id or created_for_sub_admin
    return ticket.user_id == current_user.id


def _ticket_query():
    return select(SupportTicket).options(
        joinedload(SupportTicket.messages),
        joinedload(SupportTicket.user),
        joinedload(SupportTicket.assigned_admin),
    )


def _load_ticket(db: Session, ticket_id: int) -> SupportTicket | None:
    ticket = db.scalar(_ticket_query().where(SupportTicket.id == ticket_id))
    if ticket:
        _decorate_ticket(ticket)
    return ticket


def _default_support_owner_id(user: User) -> int | None:
    return user.managed_by_admin_id or user.created_by_admin_id


def _mark_ticket_read_for_user(db: Session, ticket_id: int, user_id: int) -> int:
    message_ids = db.scalars(
        select(SupportMessage.id)
        .join(SupportTicket, SupportMessage.ticket_id == SupportTicket.id)
        .where(
            SupportTicket.id == ticket_id,
            SupportTicket.user_id == user_id,
            SupportMessage.is_admin_reply.is_(True),
            SupportMessage.read_by_user.is_(False),
        )
    ).all()

    if not message_ids:
        return 0

    updated = (
        db.query(SupportMessage)
        .filter(SupportMessage.id.in_(message_ids))
        .update({SupportMessage.read_by_user: True}, synchronize_session=False)
    )
    db.commit()
    return int(updated)


def _verify_ws_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError("Invalid token")
        return int(user_id)
    except (JWTError, ValueError) as exc:
        raise ValueError("Invalid token") from exc


@router.post("/tickets", response_model=SupportTicketSchema)
def create_ticket(
    ticket_in: SupportTicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = SupportTicket(
        user_id=current_user.id,
        assigned_to_admin_id=_default_support_owner_id(current_user),
        subject=ticket_in.subject,
        status=SupportTicketStatus.OPEN,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    message = SupportMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        content=ticket_in.message,
        is_admin_reply=False,
        read_by_admin=False,
        read_by_user=True,
    )
    db.add(message)
    db.commit()

    ticket_with_messages = db.scalar(_ticket_query().where(SupportTicket.id == ticket.id))
    if not ticket_with_messages:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _decorate_ticket(ticket_with_messages)


@router.get("/tickets", response_model=list[SupportTicketSchema])
def list_tickets(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[SupportTicketStatus] = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = _ticket_query().order_by(SupportTicket.updated_at.desc())

    if _is_super_admin(current_user):
        pass
    elif _role_value(current_user) == UserRole.SUB_ADMIN.value:
        query = query.where(_sub_admin_ticket_filter(current_user))
    else:
        query = query.where(SupportTicket.user_id == current_user.id)

    if status_filter:
        query = query.where(SupportTicket.status == status_filter)

    tickets = db.scalars(query.offset(skip).limit(limit)).unique().all()
    return [_decorate_ticket(ticket) for ticket in tickets]


@router.get("/tickets/{ticket_id}", response_model=SupportTicketSchema)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = _load_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if not _can_access_ticket(ticket, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")

    if not _is_admin(current_user) and ticket.user_id == current_user.id:
        _mark_ticket_read_for_user(db, ticket.id, current_user.id)
        refreshed_ticket = _load_ticket(db, ticket.id)
        return refreshed_ticket or ticket

    return ticket


@router.post("/tickets/{ticket_id}/messages", response_model=SupportTicketSchema)
async def add_message(
    ticket_id: int,
    message_in: SupportMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = _load_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    is_admin = _is_admin(current_user)
    if not _can_access_ticket(ticket, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to reply to this ticket")

    if ticket.status in [SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED] and not is_admin:
        ticket.status = SupportTicketStatus.OPEN

    message = SupportMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        content=message_in.content,
        is_admin_reply=is_admin,
        read_by_admin=is_admin,
        read_by_user=not is_admin,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    await manager.broadcast(
        ticket.id,
        {
            "id": message.id,
            "content": message.content,
            "is_admin_reply": message.is_admin_reply,
            "read_by_admin": message.read_by_admin,
            "read_by_user": message.read_by_user,
            "created_at": message.created_at.isoformat(),
            "sender_id": message.sender_id,
        },
    )

    updated_ticket = _load_ticket(db, ticket.id)
    if not updated_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return updated_ticket


@router.get("/unread-count", response_model=dict)
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN)),
):
    query = db.query(SupportMessage).join(SupportTicket, SupportMessage.ticket_id == SupportTicket.id).filter(
        SupportMessage.is_admin_reply.is_(False),
        SupportMessage.read_by_admin.is_(False),
    )
    if not _is_super_admin(current_user):
        query = query.filter(_sub_admin_ticket_filter(current_user))
    count = query.count()
    return {"unread": int(count)}


@router.post("/mark-all-read", response_model=dict)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN)),
):
    message_ids_query = select(SupportMessage.id).join(SupportTicket, SupportMessage.ticket_id == SupportTicket.id).where(
        SupportMessage.is_admin_reply.is_(False),
        SupportMessage.read_by_admin.is_(False),
    )
    if not _is_super_admin(current_user):
        message_ids_query = message_ids_query.where(_sub_admin_ticket_filter(current_user))

    message_ids = db.scalars(message_ids_query).all()
    if not message_ids:
        return {"updated": 0}

    updated = (
        db.query(SupportMessage)
        .filter(SupportMessage.id.in_(message_ids))
        .update({SupportMessage.read_by_admin: True}, synchronize_session=False)
    )
    db.commit()
    return {"updated": int(updated)}


@router.get("/client-unread-count", response_model=dict)
def client_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SupportMessage).join(SupportTicket, SupportMessage.ticket_id == SupportTicket.id).filter(
        SupportTicket.user_id == current_user.id,
        SupportMessage.is_admin_reply.is_(True),
        SupportMessage.read_by_user.is_(False),
    )
    return {"unread": int(query.count())}


@router.post("/tickets/{ticket_id}/mark-read", response_model=dict)
def mark_ticket_read(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = _load_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if not _can_access_ticket(ticket, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")

    if _is_admin(current_user):
        return {"updated": 0}
    return {"updated": _mark_ticket_read_for_user(db, ticket_id, current_user.id)}


@router.put("/tickets/{ticket_id}/status", response_model=SupportTicketSchema)
def update_ticket_status(
    ticket_id: int,
    status_update: SupportTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.SUB_ADMIN)),
):
    ticket = _load_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if not _can_access_ticket(ticket, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to update this ticket")

    if status_update.status:
        ticket.status = status_update.status
    db.commit()

    updated_ticket = _load_ticket(db, ticket.id)
    if not updated_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return updated_ticket


@router.put("/tickets/{ticket_id}/assignment", response_model=SupportTicketSchema)
def assign_ticket(
    ticket_id: int,
    assignment: SupportTicketAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    ticket = _load_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if assignment.assigned_to_admin_id is None:
        ticket.assigned_to_admin_id = None
    else:
        assignee = db.get(User, assignment.assigned_to_admin_id)
        if not assignee or _role_value(assignee) != UserRole.SUB_ADMIN.value:
            raise HTTPException(status_code=400, detail="Ticket can only be assigned to an existing sub admin")
        ticket.assigned_to_admin_id = assignee.id

    db.commit()
    updated_ticket = _load_ticket(db, ticket.id)
    if not updated_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return updated_ticket


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    ticket_id: int = Query(...),
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    try:
        user_id = _verify_ws_token(token)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return

    user = db.get(User, user_id)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid user")
        return

    ticket = _load_ticket(db, ticket_id)
    if not ticket:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Ticket not found")
        return

    is_admin = _is_admin(user)
    if not _can_access_ticket(ticket, user):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized")
        return

    await manager.connect(ticket_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            content = str(data.get("content", "")).strip()
            if not content:
                continue

            message = SupportMessage(
                ticket_id=ticket_id,
                sender_id=user_id,
                content=content,
                is_admin_reply=is_admin,
                read_by_admin=is_admin,
                read_by_user=not is_admin,
            )
            db.add(message)
            db.commit()
            db.refresh(message)

            await manager.broadcast(
                ticket_id,
                {
                    "id": message.id,
                    "content": message.content,
                    "is_admin_reply": message.is_admin_reply,
                    "read_by_admin": message.read_by_admin,
                    "read_by_user": message.read_by_user,
                    "created_at": message.created_at.isoformat(),
                    "sender_id": message.sender_id,
                },
            )
    except WebSocketDisconnect:
        await manager.disconnect(ticket_id, websocket)
    except Exception:
        await manager.disconnect(ticket_id, websocket)
