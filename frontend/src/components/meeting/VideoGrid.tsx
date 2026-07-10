"use client";

import { RemotePeer } from "@/types";
import VideoTile from "./VideoTile";

interface VideoGridProps {
  localName: string;
  localStream: MediaStream | null;
  localAudio: boolean;
  localVideo: boolean;
  localIsHost: boolean;
  localColor?: string;
  peers: RemotePeer[];
}

/** Responsive gallery grid that adapts columns to the participant count. */
export default function VideoGrid({
  localName,
  localStream,
  localAudio,
  localVideo,
  localIsHost,
  localColor,
  peers,
}: VideoGridProps) {
  const total = peers.length + 1;

  // Choose a column count that keeps tiles large — Zoom-style gallery.
  const cols =
    total <= 1
      ? "grid-cols-1"
      : total <= 4
      ? "grid-cols-1 sm:grid-cols-2"
      : total <= 9
      ? "grid-cols-2 lg:grid-cols-3"
      : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className="flex h-full w-full items-center justify-center p-3 sm:p-5">
      <div className={`grid w-full max-w-6xl gap-3 ${cols}`}>
        <VideoTile
          name={localName}
          stream={localStream}
          audioOn={localAudio}
          videoOn={localVideo}
          isLocal
          isHost={localIsHost}
          avatarColor={localColor}
        />
        {peers.map((p) => (
          <VideoTile
            key={p.peerId}
            name={p.name}
            stream={p.stream}
            audioOn={p.audioOn}
            videoOn={p.videoOn}
            isHost={p.isHost}
          />
        ))}
      </div>
    </div>
  );
}
