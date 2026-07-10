"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import Modal from "./Modal";
import { api } from "@/lib/api";
import { Meeting } from "@/types";

/** "Schedule" flow: title/description, date & time, duration -> stored meeting. */
export default function ScheduleModal({
  open,
  onClose,
  onScheduled,
}: {
  open: boolean;
  onClose: () => void;
  onScheduled: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setDuration(30);
    setError("");
    setCreated(null);
  }

  async function submit() {
    setError("");
    if (!title.trim() || !date || !time) {
      setError("Please fill in the title, date and time.");
      return;
    }
    const scheduledAt = new Date(`${date}T${time}`);
    if (isNaN(scheduledAt.getTime())) {
      setError("Invalid date or time.");
      return;
    }
    setLoading(true);
    try {
      const meeting = await api.schedule({
        title: title.trim(),
        description: description.trim() || undefined,
        // Send the wall-clock time the user picked (no UTC conversion) so it
        // round-trips and displays exactly as entered.
        scheduled_at: `${date}T${time}:00`,
        duration_minutes: duration,
      });
      setCreated(meeting);
      onScheduled();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-zoom-blue focus:ring-2 focus:ring-blue-100";

  return (
    <Modal open={open} title="Schedule a Meeting" onClose={handleClose}>
      {created ? (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <Check className="text-green-500" size={24} />
          </div>
          <h3 className="font-semibold text-gray-900">{created.title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(created.scheduled_at!).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}{" "}
            · {created.duration_minutes} min
          </p>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 p-3">
            <span className="truncate text-sm text-gray-700">
              {created.invite_link}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(created.invite_link);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="flex shrink-0 items-center gap-1 text-sm text-zoom-blue"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            onClick={handleClose}
            className="mt-5 w-full rounded-lg bg-zoom-blue py-2.5 font-medium text-white hover:bg-zoom-bluehover"
          >
            Done
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Meeting"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Agenda, notes…"
              className={inputClass + " resize-none"}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className={inputClass}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="mt-1 w-full rounded-lg bg-zoom-blue py-2.5 font-medium text-white transition hover:bg-zoom-bluehover disabled:opacity-60"
          >
            {loading ? "Scheduling…" : "Schedule"}
          </button>
        </div>
      )}
    </Modal>
  );
}
