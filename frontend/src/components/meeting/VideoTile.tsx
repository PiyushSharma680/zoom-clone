"use client";

import { useEffect, useRef } from "react";
import { MicOff, Crown, Pin } from "lucide-react";
import Avatar from "@/components/Avatar";

interface VideoTileProps {
  name: string;
  stream?: MediaStream | null;
  audioOn: boolean;
  videoOn: boolean;
  isLocal?: boolean;
  isHost?: boolean;
  avatarColor?: string;
}

/** A single participant video tile, à la Zoom's speaker/gallery grid. */
export default function VideoTile({
  name,
  stream,
  audioOn,
  videoOn,
  isLocal = false,
  isHost = false,
  avatarColor = "#2D8CFF",
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Keep the <video> element mounted at all times and (re)attach the stream
  // whenever it or the on/off state changes. Unmounting the element on toggle
  // is what previously broke restarting video — a fresh element wouldn't
  // reliably replay the existing MediaStream. We instead overlay the avatar
  // when video is off, exactly like Zoom/Meet.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;
    if (el.srcObject !== stream) el.srcObject = stream;
    if (videoOn) {
      const p = el.play();
      if (p) p.catch(() => {});
    }
  }, [stream, videoOn]);

  const showVideo = videoOn && !!stream;

  return (
    <div className="group relative aspect-video overflow-hidden rounded-xl bg-[#1c1c24] ring-1 ring-white/5">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`h-full w-full object-cover ${isLocal ? "mirror" : ""} ${
          showVideo ? "" : "invisible"
        }`}
      />
      {!showVideo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar name={name} color={avatarColor} size={72} />
        </div>
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-xs font-medium text-white backdrop-blur">
        {!audioOn && <MicOff size={13} className="text-red-400" />}
        {isHost && <Crown size={13} className="text-yellow-400" />}
        <span className="max-w-[140px] truncate">
          {name} {isLocal && "(You)"}
        </span>
      </div>

      {/* Pin affordance (visual only) */}
      <button className="absolute right-2 top-2 hidden rounded-md bg-black/50 p-1.5 text-white/80 backdrop-blur hover:bg-black/70 group-hover:block">
        <Pin size={14} />
      </button>
    </div>
  );
}
