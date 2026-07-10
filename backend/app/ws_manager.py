"""In-memory connection manager for meeting rooms.

Each meeting room maps to a set of connected peers. Peers exchange WebRTC
signaling messages (offer / answer / ICE candidates), chat messages, and
host-control events through the FastAPI WebSocket layer. Because signaling is
ephemeral, room membership lives in memory (not in SQLite).
"""
import json
from typing import Dict

from fastapi import WebSocket


class Peer:
    def __init__(self, peer_id: str, name: str, websocket: WebSocket, is_host: bool):
        self.peer_id = peer_id
        self.name = name
        self.websocket = websocket
        self.is_host = is_host
        self.audio_on = True
        self.video_on = True


class Room:
    def __init__(self, code: str):
        self.code = code
        self.peers: Dict[str, Peer] = {}


class ConnectionManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}

    def get_room(self, code: str) -> Room:
        if code not in self.rooms:
            self.rooms[code] = Room(code)
        return self.rooms[code]

    async def connect(
        self, code: str, peer_id: str, name: str, is_host: bool, websocket: WebSocket
    ) -> Peer:
        await websocket.accept()
        room = self.get_room(code)
        peer = Peer(peer_id, name, websocket, is_host)
        room.peers[peer_id] = peer

        # Tell the newcomer who is already here so it can initiate offers.
        await self.send_to_peer(
            peer,
            {
                "type": "existing-peers",
                "peers": [
                    {
                        "peerId": p.peer_id,
                        "name": p.name,
                        "isHost": p.is_host,
                        "audioOn": p.audio_on,
                        "videoOn": p.video_on,
                    }
                    for p in room.peers.values()
                    if p.peer_id != peer_id
                ],
            },
        )
        # Announce the newcomer to everyone else.
        await self.broadcast(
            code,
            {
                "type": "peer-joined",
                "peerId": peer_id,
                "name": name,
                "isHost": is_host,
            },
            exclude=peer_id,
        )
        return peer

    def disconnect(self, code: str, peer_id: str):
        room = self.rooms.get(code)
        if room and peer_id in room.peers:
            del room.peers[peer_id]
            if not room.peers:
                self.rooms.pop(code, None)

    async def send_to_peer(self, peer: Peer, message: dict):
        try:
            await peer.websocket.send_text(json.dumps(message))
        except Exception:
            pass

    async def relay(self, code: str, target_id: str, message: dict):
        """Relay a 1:1 signaling message (offer/answer/ice) to a specific peer."""
        room = self.rooms.get(code)
        if room and target_id in room.peers:
            await self.send_to_peer(room.peers[target_id], message)

    async def broadcast(self, code: str, message: dict, exclude: str | None = None):
        room = self.rooms.get(code)
        if not room:
            return
        for pid, peer in list(room.peers.items()):
            if pid == exclude:
                continue
            await self.send_to_peer(peer, message)


manager = ConnectionManager()
