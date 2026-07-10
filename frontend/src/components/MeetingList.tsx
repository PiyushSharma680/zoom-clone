"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Video, Copy, Check, Users } from "lucide-react";
import { Meeting } from "@/types";

function formatWhen(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ` · ${time}`;
}

function MeetingRow({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const slug = meeting.meeting_code.replace(/\s/g, "");
  const ended = meeting.status === "ended";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 transition hover:shadow-card">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
          ended ? "bg-gray-100 text-gray-400" : "bg-blue-50 text-zoom-blue"
        }`}
      >
        {meeting.meeting_type === "scheduled" ? (
          <Calendar size={20} />
        ) : (
          <Video size={20} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-gray-900">{meeting.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <span>ID: {meeting.meeting_code}</span>
          {meeting.scheduled_at && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatWhen(meeting.scheduled_at)}
            </span>
          )}
          {ended && meeting.meeting_type === "instant" && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatWhen(meeting.created_at)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={12} /> {meeting.duration_minutes} min
          </span>
        </div>
      </div>

      {!ended ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(meeting.invite_link);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
            title="Copy invite link"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            onClick={() => router.push(`/meeting/${slug}?host=1`)}
            className="rounded-lg bg-zoom-blue px-4 py-2 text-sm font-medium text-white hover:bg-zoom-bluehover"
          >
            Start
          </button>
        </div>
      ) : (
        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
          Ended
        </span>
      )}
    </div>
  );
}

export default function MeetingList({
  title,
  meetings,
  emptyLabel,
  loading,
}: {
  title: string;
  meetings: Meeting[];
  emptyLabel: string;
  loading: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h2>
      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-[76px] animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <MeetingRow key={m.id} meeting={m} />
          ))}
        </div>
      )}
    </section>
  );
}
