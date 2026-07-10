"use client";

import { useEffect, useState } from "react";
import { Mic, Video, Check, User as UserIcon } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/auth";

/** Keys used to persist meeting device preferences (read by PreJoin). */
const AUDIO_KEY = "zc_default_audio";
const VIDEO_KEY = "zc_default_video";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-zoom-blue" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [audio, setAudio] = useState(true);
  const [video, setVideo] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAudio(localStorage.getItem(AUDIO_KEY) !== "false");
    setVideo(localStorage.getItem(VIDEO_KEY) !== "false");
  }, []);

  function save() {
    localStorage.setItem(AUDIO_KEY, String(audio));
    localStorage.setItem(VIDEO_KEY, String(video));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  const card =
    "rounded-2xl border border-gray-100 bg-white p-5 shadow-card";

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage your profile and default meeting preferences.
      </p>

      <div className="mt-6 space-y-5">
        {/* Profile */}
        <section className={card}>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <UserIcon size={15} /> Profile
          </h2>
          <div className="flex items-center gap-4">
            <Avatar
              name={user?.name || "Guest"}
              color={user?.avatar_color}
              size={64}
            />
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {user?.name}
              </div>
              <div className="text-sm text-gray-500">{user?.email}</div>
            </div>
          </div>
        </section>

        {/* Device defaults */}
        <section className={card}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Meeting Defaults
          </h2>
          <div className="divide-y divide-gray-100">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Mic size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    Join with microphone on
                  </div>
                  <div className="text-xs text-gray-400">
                    Applied on the pre-join screen.
                  </div>
                </div>
              </div>
              <Toggle checked={audio} onChange={setAudio} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Video size={18} className="text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    Join with camera on
                  </div>
                  <div className="text-xs text-gray-400">
                    Applied on the pre-join screen.
                  </div>
                </div>
              </div>
              <Toggle checked={video} onChange={setVideo} />
            </div>
          </div>

          <button
            onClick={save}
            className="mt-4 flex items-center gap-2 rounded-lg bg-zoom-blue px-4 py-2 text-sm font-medium text-white hover:bg-zoom-bluehover"
          >
            {saved ? <Check size={16} /> : null}
            {saved ? "Saved" : "Save preferences"}
          </button>
        </section>
      </div>
    </AppShell>
  );
}
