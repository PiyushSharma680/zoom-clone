"use client";

import { Video, Plus, Calendar, ArrowUpRight } from "lucide-react";

interface ActionButtonsProps {
  onNew: () => void;
  onJoin: () => void;
  onSchedule: () => void;
}

const actions = [
  {
    key: "new",
    label: "New Meeting",
    sub: "Start an instant meeting",
    icon: Video,
    color: "bg-zoom-blue",
  },
  {
    key: "join",
    label: "Join",
    sub: "Join with a meeting ID",
    icon: Plus,
    color: "bg-zoom-blue",
  },
  {
    key: "schedule",
    label: "Schedule",
    sub: "Plan a future meeting",
    icon: Calendar,
    color: "bg-orange-400",
  },
  {
    key: "share",
    label: "Share Screen",
    sub: "Share to a Zoom Room",
    icon: ArrowUpRight,
    color: "bg-orange-400",
  },
] as const;

/** The four large tile buttons at the top of the Zoom home screen. */
export default function ActionButtons({
  onNew,
  onJoin,
  onSchedule,
}: ActionButtonsProps) {
  const handlers: Record<string, () => void> = {
    new: onNew,
    join: onJoin,
    schedule: onSchedule,
    share: onNew,
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.key}
            onClick={handlers[a.key]}
            className="group flex flex-col items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.color} text-white transition group-hover:scale-105`}
            >
              <Icon size={22} />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{a.label}</div>
              <div className="mt-0.5 text-xs text-gray-500">{a.sub}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
