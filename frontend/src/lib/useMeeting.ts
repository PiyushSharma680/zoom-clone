"use client";

/**
 * useMeeting — the WebRTC + signaling engine for a meeting room.
 *
 * Responsibilities:
 *  - Acquire the local camera/mic stream (getUserMedia).
 *  - Open a WebSocket to the backend signaling server.
 *  - For every other peer in the room, create an RTCPeerConnection and
 *    perform the offer/answer/ICE handshake (mesh topology).
 *  - Relay + receive chat messages and mic/cam state changes.
 *  - Expose host controls (mute-all, remove participant).
 *
 * Topology: full mesh. Each peer connects directly to every other peer, which
 * is ideal for small meetings and avoids needing a media server (SFU).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "./api";
import { ChatMessage, RemotePeer } from "@/types";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export interface UseMeetingOptions {
  code: string;
  displayName: string;
  isHost: boolean;
  initialAudio: boolean;
  initialVideo: boolean;
}

export function useMeeting({
  code,
  displayName,
  isHost,
  initialAudio,
  initialVideo,
}: UseMeetingOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [audioOn, setAudioOn] = useState(initialAudio);
  const [videoOn, setVideoOn] = useState(initialVideo);
  const [connected, setConnected] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const peerIdRef = useRef<string>(
    `${Math.random().toString(36).slice(2)}-${Date.now()}`
  );
  const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // ---- helpers to mutate remote peer list ----
  const upsertPeer = useCallback((peer: Partial<RemotePeer> & { peerId: string }) => {
    setRemotePeers((prev) => {
      const idx = prev.findIndex((p) => p.peerId === peer.peerId);
      if (idx === -1) {
        return [
          ...prev,
          {
            peerId: peer.peerId,
            name: peer.name || "Guest",
            isHost: peer.isHost || false,
            audioOn: peer.audioOn ?? true,
            videoOn: peer.videoOn ?? true,
            stream: peer.stream,
          },
        ];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], ...peer };
      return next;
    });
  }, []);

  const removePeer = useCallback((peerId: string) => {
    const pc = pcsRef.current.get(peerId);
    if (pc) {
      pc.close();
      pcsRef.current.delete(peerId);
    }
    setRemotePeers((prev) => prev.filter((p) => p.peerId !== peerId));
  }, []);

  const send = useCallback((msg: object) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  // ---- create a peer connection to a specific remote peer ----
  const createPeerConnection = useCallback(
    (remoteId: string) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Push our local tracks to the remote peer.
      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          send({ type: "ice", target: remoteId, data: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        upsertPeer({ peerId: remoteId, stream: e.streams[0] });
      };

      pcsRef.current.set(remoteId, pc);
      return pc;
    },
    [send, upsertPeer]
  );

  // ---- signaling message handler ----
  const handleMessage = useCallback(
    async (raw: MessageEvent) => {
      const msg = JSON.parse(raw.data);
      const myId = peerIdRef.current;

      switch (msg.type) {
        case "existing-peers": {
          // We are the newcomer -> we initiate an offer to each existing peer.
          for (const p of msg.peers) {
            upsertPeer({
              peerId: p.peerId,
              name: p.name,
              isHost: p.isHost,
              audioOn: p.audioOn,
              videoOn: p.videoOn,
            });
            const pc = createPeerConnection(p.peerId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send({ type: "offer", target: p.peerId, data: offer });
          }
          break;
        }

        case "peer-joined": {
          upsertPeer({
            peerId: msg.peerId,
            name: msg.name,
            isHost: msg.isHost,
          });
          break;
        }

        case "offer": {
          const pc =
            pcsRef.current.get(msg.from) || createPeerConnection(msg.from);
          await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          send({ type: "answer", target: msg.from, data: answer });
          break;
        }

        case "answer": {
          const pc = pcsRef.current.get(msg.from);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.data));
          }
          break;
        }

        case "ice": {
          const pc = pcsRef.current.get(msg.from);
          if (pc && msg.data) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(msg.data));
            } catch {
              /* ignore late candidates */
            }
          }
          break;
        }

        case "peer-left": {
          removePeer(msg.peerId);
          break;
        }

        case "chat": {
          if (msg.peerId === myId) break; // our own echo already shown optimistically
          setMessages((prev) => [
            ...prev,
            { from: msg.from, content: msg.content, ts: msg.ts, peerId: msg.peerId },
          ]);
          break;
        }

        case "media-state": {
          upsertPeer({
            peerId: msg.peerId,
            audioOn: msg.audioOn,
            videoOn: msg.videoOn,
          });
          break;
        }

        case "force-mute": {
          // Host muted everyone.
          localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = false));
          setAudioOn(false);
          send({ type: "media-state", audioOn: false, videoOn: videoOn });
          break;
        }

        case "removed": {
          setRemoved(true);
          break;
        }
      }
    },
    [createPeerConnection, removePeer, send, upsertPeer, videoOn]
  );

  // ---- lifecycle: acquire media + connect ws ----
  useEffect(() => {
    let cancelled = false;

    async function init() {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        // Fall back to an empty stream so the user can still join (view-only).
        stream = new MediaStream();
        setMediaError(
          "Camera/microphone unavailable — you joined without media."
        );
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      // Apply initial toggle states.
      stream.getAudioTracks().forEach((t) => (t.enabled = initialAudio));
      stream.getVideoTracks().forEach((t) => (t.enabled = initialVideo));
      localStreamRef.current = stream;
      setLocalStream(stream);

      const slug = code.replace(/\s/g, "");
      const url = `${WS_URL}/ws/${slug}?peerId=${peerIdRef.current}&name=${encodeURIComponent(
        displayName
      )}&host=${isHost}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onmessage = handleMessage;
    }

    init();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      pcsRef.current.forEach((pc) => pc.close());
      pcsRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- controls ----
  const toggleAudio = useCallback(() => {
    const next = !audioOn;
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = next));
    setAudioOn(next);
    send({ type: "media-state", audioOn: next, videoOn });
  }, [audioOn, videoOn, send]);

  const toggleVideo = useCallback(() => {
    const next = !videoOn;
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = next));
    setVideoOn(next);
    send({ type: "media-state", audioOn, videoOn: next });
  }, [audioOn, videoOn, send]);

  const sendChat = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      // optimistic local echo
      setMessages((prev) => [
        ...prev,
        {
          from: displayName,
          content,
          ts: new Date().toISOString(),
          peerId: peerIdRef.current,
        },
      ]);
      send({ type: "chat", content });
    },
    [displayName, send]
  );

  const muteAll = useCallback(() => send({ type: "host-mute-all" }), [send]);
  const removeParticipant = useCallback(
    (peerId: string) => send({ type: "host-remove", target: peerId }),
    [send]
  );

  // Screen share: replace the outgoing video track on every peer connection.
  const shareScreen = useCallback(async () => {
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      const screenTrack = display.getVideoTracks()[0];
      pcsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        sender?.replaceTrack(screenTrack);
      });
      // Show it locally too.
      const local = localStreamRef.current;
      if (local) {
        const oldTrack = local.getVideoTracks()[0];
        screenTrack.onended = () => {
          // Restore camera when sharing stops.
          pcsRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === "video");
            if (oldTrack) sender?.replaceTrack(oldTrack);
          });
        };
      }
    } catch {
      /* user cancelled */
    }
  }, []);

  return {
    peerId: peerIdRef.current,
    localStream,
    remotePeers,
    messages,
    audioOn,
    videoOn,
    connected,
    removed,
    mediaError,
    toggleAudio,
    toggleVideo,
    sendChat,
    muteAll,
    removeParticipant,
    shareScreen,
  };
}
