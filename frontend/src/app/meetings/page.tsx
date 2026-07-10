"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Video,
  Clock,
  Users,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { api } from "@/lib/api";
import { Meeting } from "@/types";

type Tab = "upcoming" | "scheduled" | "previous";

function whenLabel(m: Meeting) {
  const iso = m.scheduled_at || m.created_at;
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Row({
  m,
  onDeleted,
}: {
  m: Meeting;
  onDeleted: (code: string) => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const slug = m.meeting_code.replace(/\s/g, "");
  const ended = m.status === "ended";

  async function del() {
    if (!confirm(`Delete "${m.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.deleteMeeting(m.meeting_code);
      onDeleted(m.meeting_code);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition hover:shadow-card">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
          ended ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-zoom-blue"
        }`}
      >
        {m.meeting_type === "scheduled" ? (
          <Calendar size={20} />
        ) : (
          <Video size={20} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-gray-900">{m.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span>ID: {m.meeting_code}</span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {whenLabel(m)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} /> {m.duration_minutes} min
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
              ended
                ? "bg-gray-100 text-gray-500"
                : m.status === "scheduled"
                ? "bg-orange-50 text-orange-500"
                : "bg-green-50 text-green-600"
            }`}
          >
            {m.status}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(m.invite_link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
          title="Copy invite link"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <button
          onClick={del}
          disabled={deleting}
          className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          title="Delete meeting"
        >
          <Trash2 size={16} />
        </button>
        {!ended && (
          <button
            onClick={() => router.push(`/meeting/${slug}?host=1`)}
            className="rounded-lg bg-zoom-blue px-4 py-2 text-sm font-medium text-white hover:bg-zoom-bluehover"
          >
            Start
          </button>
        )}
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("upcoming");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMeetings(await api.allMeetings());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const now = Date.now();
  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (tab === "previous") return m.status === "ended";
      if (tab === "scheduled") return m.meeting_type === "scheduled" && m.status !== "ended";
      // upcoming = not ended, scheduled in the future or active now
      if (m.status === "ended") return false;
      const t = m.scheduled_at ? new Date(m.scheduled_at).getTime() : now;
      return t >= now - 60 * 60 * 1000;
    });
  }, [meetings, tab, now]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "scheduled", label: "Scheduled" },
    { key: "previous", label: "Previous" },
  ];

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
      <p className="mt-1 text-sm text-gray-500">
        All your meetings in one place.
      </p>

      <div className="mt-6 flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-zoom-blue text-zoom-blue"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
            No {tab} meetings.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <Row
                key={m.id}
                m={m}
                onDeleted={(code) =>
                  setMeetings((prev) =>
                    prev.filter((x) => x.meeting_code !== code)
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
