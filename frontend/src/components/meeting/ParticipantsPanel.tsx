"use client";

import { Mic, MicOff, Crown, X, UserMinus, ShieldCheck } from "lucide-react";
import Avatar from "@/components/Avatar";
import { RemotePeer } from "@/types";

interface ParticipantsPanelProps {
  localName: string;
  localAudio: boolean;
  localIsHost: boolean;
  peers: RemotePeer[];
  onClose: () => void;
  onMuteAll: () => void;
  onRemove: (peerId: string) => void;
}

/** Side panel listing participants, with host controls (mute all / remove). */
export default function ParticipantsPanel({
  localName,
  localAudio,
  localIsHost,
  peers,
  onClose,
  onMuteAll,
  onRemove,
}: ParticipantsPanelProps) {
  const total = peers.length + 1;

  return (
    <aside className="flex h-full w-full flex-col bg-[#232333] text-white sm:w-80">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold">Participants ({total})</h3>
        <button onClick={onClose} className="rounded p-1 hover:bg-white/10">
          <X size={18} />
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-2 py-2">
        {/* Local user */}
        <Row
          name={`${localName} (You)`}
          audioOn={localAudio}
          isHost={localIsHost}
        />
        {peers.map((p) => (
          <Row
            key={p.peerId}
            name={p.name}
            audioOn={p.audioOn}
            isHost={p.isHost}
            canRemove={localIsHost}
            onRemove={() => onRemove(p.peerId)}
          />
        ))}
      </div>

      {localIsHost && (
        <div className="border-t border-white/10 p-3">
          <button
            onClick={onMuteAll}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-medium hover:bg-white/20"
          >
            <ShieldCheck size={16} /> Mute All
          </button>
        </div>
      )}
    </aside>
  );
}

function Row({
  name,
  audioOn,
  isHost,
  canRemove,
  onRemove,
}: {
  name: string;
  audioOn: boolean;
  isHost: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
      <Avatar name={name.replace(" (You)", "")} size={32} />
      <span className="flex-1 truncate text-sm">{name}</span>
      {isHost && <Crown size={14} className="text-yellow-400" />}
      {audioOn ? (
        <Mic size={16} className="text-gray-300" />
      ) : (
        <MicOff size={16} className="text-red-400" />
      )}
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          title="Remove participant"
          className="hidden rounded p-1 text-red-400 hover:bg-red-500/20 group-hover:block"
        >
          <UserMinus size={16} />
        </button>
      )}
    </div>
  );
}
