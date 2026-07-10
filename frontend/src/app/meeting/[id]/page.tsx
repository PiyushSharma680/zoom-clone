"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Meeting } from "@/types";
import PreJoin from "@/components/meeting/PreJoin";
import MeetingRoom from "@/components/meeting/MeetingRoom";

/**
 * Meeting route: validates the meeting exists, shows the pre-join lobby,
 * then mounts the live meeting room once the user joins.
 */
export default function MeetingPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const code = String(params.id);
  const isHost = search.get("host") === "1";

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [status, setStatus] = useState<"loading" | "notfound" | "ready">(
    "loading"
  );
  const [joined, setJoined] = useState<{
    name: string;
    audio: boolean;
    video: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.validate(code);
        if (!res.exists || !res.meeting) {
          setStatus("notfound");
          return;
        }
        setMeeting(res.meeting);
        setStatus("ready");
      } catch {
        setStatus("notfound");
      }
    })();
  }, [code]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E0E10] text-gray-400">
        Preparing your meeting…
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0E0E10] px-4 text-center text-white">
        <AlertCircle size={40} className="mb-3 text-red-400" />
        <h1 className="text-lg font-semibold">Meeting not found</h1>
        <p className="mt-1 text-sm text-gray-400">
          This meeting doesn&apos;t exist or has already ended.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-5 rounded-lg bg-zoom-blue px-5 py-2.5 text-sm font-medium hover:bg-zoom-bluehover"
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!joined) {
    return (
      <PreJoin
        meeting={meeting!}
        defaultName={user?.name || ""}
        onJoin={setJoined}
      />
    );
  }

  return (
    <MeetingRoom
      meeting={meeting!}
      displayName={joined.name}
      isHost={isHost}
      initialAudio={joined.audio}
      initialVideo={joined.video}
      avatarColor={user?.avatar_color}
    />
  );
}
