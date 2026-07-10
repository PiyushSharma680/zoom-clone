"use client";

import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  Users,
  MessageSquare,
  PhoneOff,
  ShieldCheck,
} from "lucide-react";

interface ControlBarProps {
  audioOn: boolean;
  videoOn: boolean;
  isHost: boolean;
  participantCount: number;
  unreadChat: number;
  panel: "participants" | "chat" | null;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  onTogglePanel: (p: "participants" | "chat") => void;
  onMuteAll: () => void;
  onLeave: () => void;
}

interface CtrlProps {
  active?: boolean;
  danger?: boolean;
  label: string;
  onClick?: () => void;
  badge?: number;
  children: React.ReactNode;
}

function Ctrl({ active, danger, label, onClick, badge, children }: CtrlProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex min-w-[64px] flex-col items-center gap-1 px-2 py-1"
    >
      <span
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition ${
          danger
            ? "bg-red-500 text-white hover:bg-red-600"
            : active
            ? "bg-zoom-blue text-white"
            : "bg-white/10 text-white hover:bg-white/20"
        }`}
      >
        {children}
        {badge ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="text-[11px] text-gray-300">{label}</span>
    </button>
  );
}

/** Bottom control bar — the heart of the Zoom meeting UI. */
export default function ControlBar(props: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-1 border-t border-white/5 bg-[#1a1a20] px-2 py-2 sm:gap-2 sm:px-4">
      <Ctrl
        label={props.audioOn ? "Mute" : "Unmute"}
        active={false}
        onClick={props.onToggleAudio}
      >
        {props.audioOn ? <Mic size={20} /> : <MicOff size={20} className="text-red-400" />}
      </Ctrl>

      <Ctrl
        label={props.videoOn ? "Stop Video" : "Start Video"}
        onClick={props.onToggleVideo}
      >
        {props.videoOn ? (
          <VideoIcon size={20} />
        ) : (
          <VideoOff size={20} className="text-red-400" />
        )}
      </Ctrl>

      <Ctrl label="Share" onClick={props.onShareScreen}>
        <MonitorUp size={20} />
      </Ctrl>

      <Ctrl
        label="Participants"
        active={props.panel === "participants"}
        onClick={() => props.onTogglePanel("participants")}
        badge={props.participantCount}
      >
        <Users size={20} />
      </Ctrl>

      <Ctrl
        label="Chat"
        active={props.panel === "chat"}
        onClick={() => props.onTogglePanel("chat")}
        badge={props.unreadChat || undefined}
      >
        <MessageSquare size={20} />
      </Ctrl>

      {props.isHost && (
        <Ctrl label="Mute All" onClick={props.onMuteAll}>
          <ShieldCheck size={20} />
        </Ctrl>
      )}

      <Ctrl label={props.isHost ? "End" : "Leave"} danger onClick={props.onLeave}>
        <PhoneOff size={20} />
      </Ctrl>
    </div>
  );
}
