"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, ShieldCheck, Lock } from "lucide-react";
import { useMeeting } from "@/lib/useMeeting";
import { api } from "@/lib/api";
import { Meeting } from "@/types";
import VideoGrid from "./VideoGrid";
import ControlBar from "./ControlBar";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";

interface MeetingRoomProps {
  meeting: Meeting;
  displayName: string;
  isHost: boolean;
  initialAudio: boolean;
  initialVideo: boolean;
  avatarColor?: string;
}

/** The active meeting room: video grid + controls + side panels. */
export default function MeetingRoom({
  meeting,
  displayName,
  isHost,
  initialAudio,
  initialVideo,
  avatarColor,
}: MeetingRoomProps) {
  const router = useRouter();
  const {
    localStream,
    remotePeers,
    messages,
    audioOn,
    videoOn,
    removed,
    mediaError,
    connected,
    toggleAudio,
    toggleVideo,
    sendChat,
    muteAll,
    removeParticipant,
    shareScreen,
  } = useMeeting({
    code: meeting.meeting_code,
    displayName,
    isHost,
    initialAudio,
    initialVideo,
  });

  const [panel, setPanel] = useState<"participants" | "chat" | null>(null);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastSeenChat, setLastSeenChat] = useState(0);

  // Meeting timer.
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Track unread chat.
  useEffect(() => {
    if (panel === "chat") setLastSeenChat(messages.length);
  }, [panel, messages.length]);

  // If host removed us, leave.
  useEffect(() => {
    if (removed) {
      alert("You have been removed from the meeting by the host.");
      router.push("/");
    }
  }, [removed, router]);

  async function leave() {
    if (isHost) {
      try {
        await api.endMeeting(meeting.meeting_code);
      } catch {
        /* ignore */
      }
    }
    router.push("/");
  }

  const unread = panel === "chat" ? 0 : messages.length - lastSeenChat;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0E0E10] text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2.5 text-sm">
        <div className="flex items-center gap-3">
          <Lock size={14} className="text-green-400" />
          <span className="font-medium">{meeting.title}</span>
          <span className="hidden text-gray-400 sm:inline">{mm}:{ss}</span>
        </div>
        <div className="flex items-center gap-2">
          {isHost && (
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs">
              <ShieldCheck size={13} className="text-yellow-400" /> Host
            </span>
          )}
          <span
            className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs sm:flex ${
              connected ? "bg-green-500/15 text-green-400" : "bg-yellow-500/15 text-yellow-300"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-green-400" : "bg-yellow-400"}`} />
            {connected ? "Connected" : "Connecting…"}
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(meeting.invite_link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs hover:bg-white/20"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Invite"}
          </button>
        </div>
      </header>

      {mediaError && (
        <div className="bg-yellow-500/10 px-4 py-1.5 text-center text-xs text-yellow-300">
          {mediaError}
        </div>
      )}

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <VideoGrid
            localName={displayName}
            localStream={localStream}
            localAudio={audioOn}
            localVideo={videoOn}
            localIsHost={isHost}
            localColor={avatarColor}
            peers={remotePeers}
          />
        </div>

        {panel === "participants" && (
          <ParticipantsPanel
            localName={displayName}
            localAudio={audioOn}
            localIsHost={isHost}
            peers={remotePeers}
            onClose={() => setPanel(null)}
            onMuteAll={muteAll}
            onRemove={removeParticipant}
          />
        )}
        {panel === "chat" && (
          <ChatPanel
            messages={messages}
            myName={displayName}
            onClose={() => setPanel(null)}
            onSend={sendChat}
          />
        )}
      </div>

      {/* Controls */}
      <ControlBar
        audioOn={audioOn}
        videoOn={videoOn}
        isHost={isHost}
        participantCount={remotePeers.length + 1}
        unreadChat={unread}
        panel={panel}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onShareScreen={shareScreen}
        onTogglePanel={(p) => setPanel((cur) => (cur === p ? null : p))}
        onMuteAll={muteAll}
        onLeave={leave}
      />
    </div>
  );
}
