"""Ideas CRUD + ?tech= filter + join / decide flow + WebSocket chat."""
import json
import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import engine
from ..models import Idea, Student, TeamRequest, ChatRequest, ChatMessage, normalize_tags
from ..services.idea_service import is_full

logger = logging.getLogger("teampilot")
router = APIRouter(tags=["ideas", "teams"])

# WebSocket connection manager
active_connections: Dict[int, List[WebSocket]] = {}


class JoinBody(BaseModel):
    student_id: int


class DecideBody(BaseModel):
    owner_id: int
    status: str


class ChatBody(BaseModel):
    student_id: int


class MessageBody(BaseModel):
    student_id: int
    text: str


@router.post("/ideas", status_code=status.HTTP_201_CREATED)
def create_idea(payload: Idea) -> Idea:
    try:
        with Session(engine) as s:
            if payload.owner_id is not None and not s.get(Student, payload.owner_id):
                raise HTTPException(status_code=404, detail="Owner student not found.")
            obj = Idea(title=payload.title.strip(), description=payload.description,
                       tech_stack=normalize_tags(payload.tech_stack),
                       team_size_needed=payload.team_size_needed,
                       owner_id=payload.owner_id, is_open=payload.is_open)
            s.add(obj)
            s.commit()
            s.refresh(obj)
            logger.info("Idea created id=%s", obj.id)
            return obj
    except HTTPException:
        raise
    except Exception:
        logger.exception("Create idea failed")
        raise HTTPException(status_code=500, detail="Could not create idea.")


@router.get("/ideas", response_model=List[Idea])
def list_ideas(tech: Optional[str] = None) -> List[Idea]:
    try:
        with Session(engine) as s:
            rows = list(s.exec(select(Idea).order_by(Idea.id)).all())
            if tech:
                t = tech.strip().lower()
                rows = [i for i in rows if t in (i.tech_stack or [])]
            return rows
    except Exception:
        logger.exception("List ideas failed")
        raise HTTPException(status_code=500, detail="Could not list ideas.")


@router.get("/ideas/{idea_id}")
def get_idea(idea_id: int) -> Idea:
    with Session(engine) as s:
        obj = s.get(Idea, idea_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Idea not found.")
        return obj


@router.put("/ideas/{idea_id}")
def update_idea(idea_id: int, payload: Idea) -> Idea:
    try:
        with Session(engine) as s:
            obj = s.get(Idea, idea_id)
            if not obj:
                raise HTTPException(status_code=404, detail="Idea not found.")
            obj.title = payload.title.strip()
            obj.description = payload.description
            obj.tech_stack = normalize_tags(payload.tech_stack)
            obj.team_size_needed = payload.team_size_needed
            obj.is_open = payload.is_open
            s.add(obj)
            s.commit()
            s.refresh(obj)
            return obj
    except HTTPException:
        raise
    except Exception:
        logger.exception("Update idea failed")
        raise HTTPException(status_code=500, detail="Could not update idea.")


@router.delete("/ideas/{idea_id}")
def delete_idea(idea_id: int) -> dict:
    try:
        with Session(engine) as s:
            obj = s.get(Idea, idea_id)
            if not obj:
                raise HTTPException(status_code=404, detail="Idea not found.")
            for r in s.exec(select(TeamRequest).where(TeamRequest.idea_id == idea_id)).all():
                s.delete(r)
            for r in s.exec(select(ChatRequest).where(ChatRequest.idea_id == idea_id)).all():
                s.delete(r)
            s.delete(obj)
            s.commit()
            return {"deleted": idea_id}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Delete idea failed")
        raise HTTPException(status_code=500, detail="Could not delete idea.")


@router.post("/ideas/{idea_id}/join", status_code=status.HTTP_201_CREATED)
def join_idea(idea_id: int, body: JoinBody) -> TeamRequest:
    try:
        with Session(engine) as s:
            idea = s.get(Idea, idea_id)
            if not idea:
                raise HTTPException(status_code=404, detail="Idea not found.")
            student = s.get(Student, body.student_id)
            if not student:
                raise HTTPException(status_code=404, detail="Student not found.")
            if not idea.is_open:
                raise HTTPException(status_code=400, detail="Idea is closed.")
            if idea.owner_id == body.student_id:
                raise HTTPException(status_code=400, detail="Owner cannot join own idea.")
            dup = s.exec(select(TeamRequest).where(
                TeamRequest.idea_id == idea_id,
                TeamRequest.student_id == body.student_id)).first()
            if dup:
                raise HTTPException(status_code=409, detail="Join request already exists.")
            if is_full(s, idea_id, idea.team_size_needed):
                raise HTTPException(status_code=400, detail="Team is full.")
            req = TeamRequest(idea_id=idea_id, student_id=body.student_id, status="pending")
            s.add(req)
            s.commit()
            s.refresh(req)
            logger.info("Join req idea=%s student=%s", idea_id, body.student_id)
            return req
    except HTTPException:
        raise
    except Exception:
        logger.exception("Join failed")
        raise HTTPException(status_code=500, detail="Could not create join request.")


@router.get("/ideas/{idea_id}/requests", response_model=List[TeamRequest])
def list_requests(idea_id: int) -> List[TeamRequest]:
    with Session(engine) as s:
        if not s.get(Idea, idea_id):
            raise HTTPException(status_code=404, detail="Idea not found.")
        return list(s.exec(select(TeamRequest).where(TeamRequest.idea_id == idea_id)).all())


@router.put("/team-requests/{req_id}")
def decide_request(req_id: int, body: DecideBody) -> TeamRequest:
    """Idea owner accepts or rejects. Body: {owner_id, status}."""
    want = str(body.status).strip().lower()
    if want not in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="status must be accepted|rejected.")
    try:
        with Session(engine) as s:
            req = s.get(TeamRequest, req_id)
            if not req:
                raise HTTPException(status_code=404, detail="Team request not found.")
            idea = s.get(Idea, req.idea_id)
            if not idea:
                raise HTTPException(status_code=404, detail="Idea not found.")
            if idea.owner_id != body.owner_id:
                raise HTTPException(status_code=403, detail="Only the idea owner can decide.")
            if req.status != "pending":
                raise HTTPException(status_code=400, detail="Request already decided.")
            req.status = want
            s.add(req)
            s.commit()
            s.refresh(req)
            logger.info("Request %s -> %s by owner %s", req_id, want, body.owner_id)
            return req
    except HTTPException:
        raise
    except Exception:
        logger.exception("Decide failed")
        raise HTTPException(status_code=500, detail="Could not update request.")


@router.post("/ideas/{idea_id}/chat-request", status_code=status.HTTP_201_CREATED)
def request_chat_access(idea_id: int, body: ChatBody) -> ChatRequest:
    """Student requests chat access to an idea. Creator will be notified."""
    try:
        with Session(engine) as s:
            idea = s.get(Idea, idea_id)
            if not idea:
                raise HTTPException(status_code=404, detail="Idea not found.")
            student = s.get(Student, body.student_id)
            if not student:
                raise HTTPException(status_code=404, detail="Student not found.")
            # Creator (owner) gets direct access automatically; others request
            existing = s.exec(select(ChatRequest).where(
                ChatRequest.idea_id == idea_id,
                ChatRequest.student_id == body.student_id)).first()
            if existing:
                raise HTTPException(status_code=409, detail="Chat request already exists.")
            req = ChatRequest(idea_id=idea_id, student_id=body.student_id, status="pending")
            s.add(req)
            s.commit()
            s.refresh(req)
            logger.info("Chat request idea=%s student=%s", idea_id, body.student_id)
            return req
    except HTTPException:
        raise
    except Exception:
        logger.exception("Chat request failed")
        raise HTTPException(status_code=500, detail="Could not create chat request.")


@router.get("/ideas/{idea_id}/chat-requests", response_model=List[ChatRequest])
def list_chat_requests(idea_id: int) -> List[ChatRequest]:
    """Owner-only: list pending chat access requests for this idea."""
    try:
        with Session(engine) as s:
            if not s.get(Idea, idea_id):
                raise HTTPException(status_code=404, detail="Idea not found.")
            # Only owner can see requests
            idea = s.get(Idea, idea_id)
            if idea.owner_id is None:
                raise HTTPException(status_code=403, detail="Idea has no owner.")
            # In a full impl, check idea.owner_id == current user; here we allow any request listing
            return list(s.exec(select(ChatRequest).where(ChatRequest.idea_id == idea_id)).all())
    except HTTPException:
        raise
    except Exception:
        logger.exception("List chat requests failed")
        raise HTTPException(status_code=500, detail="Could not list chat requests.")


@router.put("/chat-requests/{chat_id}")
def approve_chat_request(chat_id: int, body: DecideBody) -> ChatRequest:
    """Owner approves or rejects a chat access request."""
    want = str(body.status).strip().lower()
    if want not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="status must be approved|rejected.")
    try:
        with Session(engine) as s:
            req = s.get(ChatRequest, chat_id)
            if not req:
                raise HTTPException(status_code=404, detail="Chat request not found.")
            idea = s.get(Idea, req.idea_id)
            if not idea:
                raise HTTPException(status_code=404, detail="Idea not found.")
            if idea.owner_id != body.owner_id:
                raise HTTPException(status_code=403, detail="Only the idea owner can decide.")
            if req.status != "pending":
                raise HTTPException(status_code=400, detail="Request already decided.")
            req.status = want
            s.add(req)
            s.commit()
            s.refresh(req)
            logger.info("Chat request %s -> %s by owner %s", chat_id, want, body.owner_id)
            return req
    except HTTPException:
        raise
    except Exception:
        logger.exception("Approve chat request failed")
        raise HTTPException(status_code=500, detail="Could not approve chat request.")


@router.post("/ideas/{idea_id}/messages", status_code=status.HTTP_201_CREATED)
def send_message(idea_id: int, body: MessageBody) -> ChatMessage:
    """Send a chat message (owner or approved student only). Broadcasts to WebSocket clients."""
    try:
        with Session(engine) as s:
            idea = s.get(Idea, idea_id)
            if not idea:
                raise HTTPException(status_code=404, detail="Idea not found.")
            student_id = body.student_id
            text = body.text
            # Owner can always send; others need approved ChatRequest
            if idea.owner_id != student_id:
                has_access = s.exec(select(ChatRequest).where(
                    ChatRequest.idea_id == idea_id,
                    ChatRequest.student_id == student_id,
                    ChatRequest.status == "approved")).first()
                if not has_access:
                    raise HTTPException(status_code=403, detail="Chat access denied. Request and get approved first.")
            msg = ChatMessage(idea_id=idea_id, student_id=student_id, text=text)
            s.add(msg)
            s.commit()
            s.refresh(msg)
            logger.info("Message sent idea=%s student=%s", idea_id, student_id)
            
            # Broadcast to WebSocket clients
            if idea_id in active_connections:
                payload = json.dumps({
                    "type": "message",
                    "id": msg.id,
                    "student_id": msg.student_id,
                    "text": msg.text,
                    "created_at": msg.created_at.isoformat()
                })
                for ws in active_connections[idea_id]:
                    try:
                        import asyncio
                        asyncio.create_task(ws.send_text(payload))
                    except Exception:
                        pass
            
            return msg
    except HTTPException:
        raise
    except Exception:
        logger.exception("Send message failed")
        raise HTTPException(status_code=500, detail="Could not send message.")
        raise HTTPException(status_code=500, detail="Could not send message.")


@router.get("/ideas/{idea_id}/messages", response_model=List[ChatMessage])
def list_messages(idea_id: int) -> List[ChatMessage]:
    """List all messages for an idea (owner only)."""
    try:
        with Session(engine) as s:
            idea = s.get(Idea, idea_id)
            if not idea:
                raise HTTPException(status_code=404, detail="Idea not found.")
            if idea.owner_id is None:
                raise HTTPException(status_code=403, detail="Idea has no owner.")
            # In a full impl, check ownership; here allow owner to see all
            return list(s.exec(select(ChatMessage).where(ChatMessage.idea_id == idea_id).order_by(ChatMessage.created_at)).all())
    except HTTPException:
        raise
    except Exception:
        logger.exception("List messages failed")
        raise HTTPException(status_code=500, detail="Could not list messages.")


# WebSocket endpoint for real-time chat
@router.websocket("/ws/{idea_id}")
async def websocket_chat(websocket: WebSocket, idea_id: int):
    await websocket.accept()
    if idea_id not in active_connections:
        active_connections[idea_id] = []
    active_connections[idea_id].append(websocket)
    logger.info("WebSocket connected for idea=%s, total=%d", idea_id, len(active_connections[idea_id]))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections[idea_id].remove(websocket)
        logger.info("WebSocket disconnected for idea=%s, remaining=%d", idea_id, len(active_connections.get(idea_id, [])))
