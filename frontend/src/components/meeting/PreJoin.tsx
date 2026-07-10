"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Meeting } from "@/types";

interface PreJoinProps {
  meeting: Meeting;
  defaultName: string;
  onJoin: (opts: { name: string; audio: boolean; video: boolean }) => void;
}

/** Device-check / lobby screen shown before entering the meeting room. */
export default function PreJoin({ meeting, defaultName, onJoin }: PreJoinProps) {
  const [name, setName] = useState(defaultName);
  // Honor the user's saved device defaults from Settings.
  const [audio, setAudio] = useState(true);
  const [video, setVideo] = useState(true);

  useEffect(() => {
    setAudio(localStorage.getItem("zc_default_audio") !== "false");
    setVideo(localStorage.getItem("zc_default_video") !== "false");
  }, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Live camera preview so the user can check themselves before joining.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        /* no devices — avatar fallback shown */
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Reflect toggles on the preview stream.
  useEffect(() => {
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = video));
  }, [video]);
  useEffect(() => {
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = audio));
  }, [audio]);

  function join() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onJoin({ name: name.trim() || "Guest", audio, video });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0E0E10] px-4 py-8 text-white">
      <h1 className="mb-1 text-center text-xl font-semibold">{meeting.title}</h1>
      <p className="mb-6 text-sm text-gray-400">
        Meeting ID: {meeting.meeting_code}
      </p>

      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-[1.4fr_1fr]">
        {/* Preview */}
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-[#1c1c24]">
          {video ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="mirror h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Avatar name={name || "Guest"} size={88} />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 p-4">
            <button
              onClick={() => setAudio((v) => !v)}
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                audio ? "bg-white/15 hover:bg-white/25" : "bg-red-500"
              }`}
            >
              {audio ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={() => setVideo((v) => !v)}
              className={`flex h-11 w-11 items-center justify-center rounded-full ${
                video ? "bg-white/15 hover:bg-white/25" : "bg-red-500"
              }`}
            >
              {video ? <VideoIcon size={20} /> : <VideoOff size={20} />}
            </button>
          </div>
        </div>

        {/* Join form */}
        <div className="flex flex-col justify-center">
          <label className="mb-1.5 text-sm font-medium text-gray-300">
            Your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && join()}
            placeholder="Enter display name"
            className="mb-4 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-zoom-blue"
          />
          <button
            onClick={join}
            disabled={!name.trim()}
            className="w-full rounded-lg bg-zoom-blue py-3 font-medium text-white transition hover:bg-zoom-bluehover disabled:opacity-50"
          >
            Join Now
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            Check your camera and mic before joining.
          </p>
        </div>
      </div>
    </div>
  );
}
