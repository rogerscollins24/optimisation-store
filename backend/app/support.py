from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .config import settings
from .database import get_db
from .deps import get_current_user, require_roles
from .enums import SupportTicketStatus, UserRole
from .models import SupportMessage, SupportTicket, User
from .schemas import SupportMessageCreate, SupportTicketCreate, SupportTicketSchema, SupportTicketUpdate


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


def _is_staff(user: User) -> bool:
    return user.role in [UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.OPS]


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
    )
    db.add(message)
    db.commit()

    return db.scalar(
        select(SupportTicket)
        .options(joinedload(SupportTicket.messages))
        .where(SupportTicket.id == ticket.id)
    )


@router.get("/tickets", response_model=list[SupportTicketSchema])
def list_tickets(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[SupportTicketStatus] = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(SupportTicket)
        .options(joinedload(SupportTicket.messages))
        .order_by(SupportTicket.updated_at.desc())
    )

    is_staff = _is_staff(current_user)
    if not is_staff:
        query = query.where(SupportTicket.user_id == current_user.id)

    if status_filter:
        query = query.where(SupportTicket.status == status_filter)

    tickets = db.scalars(query.offset(skip).limit(limit)).unique().all()

    if is_staff:
        for ticket in tickets:
            if ticket.user_id:
                user = db.get(User, ticket.user_id)
                if user:
                    setattr(ticket, "user_username", user.username)
                    setattr(ticket, "user_email", user.email)

    return tickets


@router.get("/tickets/{ticket_id}", response_model=SupportTicketSchema)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.scalar(
        select(SupportTicket)
        .options(joinedload(SupportTicket.messages))
        .where(SupportTicket.id == ticket_id)
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    is_staff = _is_staff(current_user)
    if ticket.user_id != current_user.id and not is_staff:
        raise HTTPException(status_code=403, detail="Not authorized to view this ticket")

    if is_staff and ticket.user_id:
        user = db.get(User, ticket.user_id)
        if user:
            setattr(ticket, "user_username", user.username)
            setattr(ticket, "user_email", user.email)

    return ticket


@router.post("/tickets/{ticket_id}/messages", response_model=SupportTicketSchema)
async def add_message(
    ticket_id: int,
    message_in: SupportMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    is_staff = _is_staff(current_user)
    if ticket.user_id != current_user.id and not is_staff:
        raise HTTPException(status_code=403, detail="Not authorized to reply to this ticket")

    if ticket.status in [SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED] and not is_staff:
        ticket.status = SupportTicketStatus.OPEN

    message = SupportMessage(
        ticket_id=ticket.id,
        sender_id=current_user.id,
        content=message_in.content,
        is_admin_reply=is_staff,
        read_by_admin=is_staff,
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
            "created_at": message.created_at.isoformat(),
            "sender_id": message.sender_id,
        },
    )

    return db.scalar(
        select(SupportTicket)
        .options(joinedload(SupportTicket.messages))
        .where(SupportTicket.id == ticket.id)
    )


@router.get("/unread-count", response_model=dict)
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.OPS)),
):
    _ = current_user
    count = (
        db.query(SupportMessage)
        .filter(
            SupportMessage.is_admin_reply.is_(False),
            SupportMessage.read_by_admin.is_(False),
        )
        .count()
    )
    return {"unread": int(count)}


@router.post("/mark-all-read", response_model=dict)
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.OPS)),
):
    _ = current_user
    updated = (
        db.query(SupportMessage)
        .filter(
            SupportMessage.is_admin_reply.is_(False),
            SupportMessage.read_by_admin.is_(False),
        )
        .update({SupportMessage.read_by_admin: True}, synchronize_session=False)
    )
    db.commit()
    return {"updated": int(updated)}


@router.put("/tickets/{ticket_id}/status", response_model=SupportTicketSchema)
def update_ticket_status(
    ticket_id: int,
    status_update: SupportTicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT, UserRole.OPS)),
):
    _ = current_user
    ticket = db.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if status_update.status:
        ticket.status = status_update.status
    db.commit()

    return db.scalar(
        select(SupportTicket)
        .options(joinedload(SupportTicket.messages))
        .where(SupportTicket.id == ticket.id)
    )


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

    ticket = db.get(SupportTicket, ticket_id)
    if not ticket:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Ticket not found")
        return

    user = db.get(User, user_id)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid user")
        return

    is_staff = _is_staff(user)
    if ticket.user_id != user_id and not is_staff:
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
                is_admin_reply=is_staff,
                read_by_admin=is_staff,
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
                    "created_at": message.created_at.isoformat(),
                    "sender_id": message.sender_id,
                },
            )
    except WebSocketDisconnect:
        await manager.disconnect(ticket_id, websocket)
    except Exception:
        await manager.disconnect(ticket_id, websocket)
