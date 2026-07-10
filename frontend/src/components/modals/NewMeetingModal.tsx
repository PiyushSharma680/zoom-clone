"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Video } from "lucide-react";
import Modal from "./Modal";
import { api } from "@/lib/api";
import { Meeting } from "@/types";

/**
 * "New Meeting" flow: create an instant meeting, show the generated ID +
 * shareable invite link, then let the host start (redirect to the room).
 */
export default function NewMeetingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [copied, setCopied] = useState<"id" | "link" | null>(null);
  const [error, setError] = useState("");

  async function create() {
    setLoading(true);
    setError("");
    try {
      setMeeting(await api.createInstant());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string, which: "id" | "link") {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1500);
  }

  function start() {
    if (!meeting) return;
    const slug = meeting.meeting_code.replace(/\s/g, "");
    router.push(`/meeting/${slug}?host=1`);
  }

  function handleClose() {
    setMeeting(null);
    setError("");
    onClose();
  }

  return (
    <Modal open={open} title="New Meeting" onClose={handleClose}>
      {!meeting ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <Video className="text-zoom-blue" size={26} />
          </div>
          <p className="mb-5 text-sm text-gray-600">
            Start an instant meeting. We&apos;ll generate a unique Meeting ID and a
            shareable invite link.
          </p>
          {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
          <button
            onClick={create}
            disabled={loading}
            className="w-full rounded-lg bg-zoom-blue py-2.5 font-medium text-white transition hover:bg-zoom-bluehover disabled:opacity-60"
          >
            {loading ? "Creating…" : "Start Instant Meeting"}
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4 rounded-xl bg-gray-50 p-4">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Meeting ID
            </label>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-lg font-semibold tracking-wide text-gray-900">
                {meeting.meeting_code}
              </span>
              <button
                onClick={() => copy(meeting.meeting_code, "id")}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-zoom-blue hover:bg-blue-50"
              >
                {copied === "id" ? <Check size={15} /> : <Copy size={15} />}
                {copied === "id" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="mb-5 rounded-xl bg-gray-50 p-4">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Invite Link
            </label>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="truncate text-sm text-gray-700">
                {meeting.invite_link}
              </span>
              <button
                onClick={() => copy(meeting.invite_link, "link")}
                className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm text-zoom-blue hover:bg-blue-50"
              >
                {copied === "link" ? <Check size={15} /> : <Copy size={15} />}
                {copied === "link" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <button
            onClick={start}
            className="w-full rounded-lg bg-zoom-blue py-2.5 font-medium text-white transition hover:bg-zoom-bluehover"
          >
            Start Meeting
          </button>
        </div>
      )}
    </Modal>
  );
}
