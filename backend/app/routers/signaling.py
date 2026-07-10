"""WebSocket signaling endpoint.

URL: /ws/{code}?peerId=...&name=...&host=true|false

Message protocol (JSON):
  Client -> Server
    { type: "offer"|"answer"|"ice", target, data }   1:1 WebRTC signaling
    { type: "chat", content }                          broadcast chat
    { type: "media-state", audioOn, videoOn }          broadcast mic/cam status
    { type: "host-mute-all" }                          host asks all to mute
    { type: "host-remove", target }                    host removes a participant

  Server -> Client
    { type: "existing-peers", peers: [...] }
    { type: "peer-joined", peerId, name, isHost }
    { type: "peer-left", peerId }
    { type: "offer"|"answer"|"ice", from, data }
    { type: "chat", from, content, ts }
    { type: "media-state", peerId, audioOn, videoOn }
    { type: "force-mute" }
    { type: "removed" }
"""
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from ..database import SessionLocal
from ..models import ChatMessage, Meeting
from ..ws_manager import manager

router = APIRouter()


def _persist_chat(code: str, sender: str, content: str):
    """Best-effort persistence of chat messages to SQLite."""
    db: Session = SessionLocal()
    try:
        normalized = code
        if code.isdigit() and len(code) == 11:
            normalized = f"{code[:3]} {code[3:7]} {code[7:]}"
        meeting = db.query(Meeting).filter(Meeting.meeting_code == normalized).first()
        if meeting:
            db.add(
                ChatMessage(
                    meeting_id=meeting.id, sender_name=sender, content=content
                )
            )
            db.commit()
    finally:
        db.close()


@router.websocket("/ws/{code}")
async def signaling(websocket: WebSocket, code: str):
    peer_id = websocket.query_params.get("peerId")
    name = websocket.query_params.get("name", "Guest")
    is_host = websocket.query_params.get("host", "false").lower() == "true"

    if not peer_id:
        await websocket.close(code=4000)
        return

    peer = await manager.connect(code, peer_id, name, is_host, websocket)

    try:
        while True:
            raw = await websocket.receive_json()
            mtype = raw.get("type")

            if mtype in ("offer", "answer", "ice"):
                target = raw.get("target")
                await manager.relay(
                    code,
                    target,
                    {"type": mtype, "from": peer_id, "data": raw.get("data")},
                )

            elif mtype == "chat":
                content = raw.get("content", "")
                _persist_chat(code, name, content)
                await manager.broadcast(
                    code,
                    {
                        "type": "chat",
                        "from": name,
                        "peerId": peer_id,
                        "content": content,
                        "ts": datetime.now().isoformat(),
                    },
                )

            elif mtype == "media-state":
                peer.audio_on = raw.get("audioOn", peer.audio_on)
                peer.video_on = raw.get("videoOn", peer.video_on)
                await manager.broadcast(
                    code,
                    {
                        "type": "media-state",
                        "peerId": peer_id,
                        "audioOn": peer.audio_on,
                        "videoOn": peer.video_on,
                    },
                    exclude=peer_id,
                )

            elif mtype == "host-mute-all" and peer.is_host:
                await manager.broadcast(
                    code, {"type": "force-mute"}, exclude=peer_id
                )

            elif mtype == "host-remove" and peer.is_host:
                target = raw.get("target")
                await manager.relay(code, target, {"type": "removed"})
                await manager.broadcast(
                    code, {"type": "peer-left", "peerId": target}
                )
                manager.disconnect(code, target)

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(code, peer_id)
        await manager.broadcast(code, {"type": "peer-left", "peerId": peer_id})
