"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "./Modal";
import { api } from "@/lib/api";

/**
 * "Join" flow: accept a Meeting ID or a full invite link, validate that the
 * meeting exists on the backend, then route to the pre-join screen.
 */
export default function JoinModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function extractCode(input: string): string {
    // Support pasting a full invite link or a raw / spaced meeting id.
    const trimmed = input.trim();
    const linkMatch = trimmed.match(/meeting\/(\d{11})/);
    if (linkMatch) return linkMatch[1];
    return trimmed.replace(/\D/g, "");
  }

  async function join() {
    setError("");
    const code = extractCode(value);
    if (code.length !== 11) {
      setError("Enter a valid 11-digit Meeting ID or invite link.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.validate(code);
      if (!res.exists) {
        setError("That meeting doesn't exist or has ended.");
        return;
      }
      router.push(`/meeting/${code}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title="Join a Meeting" onClose={onClose}>
      <div>
        <label className="text-sm font-medium text-gray-700">
          Meeting ID or invite link
        </label>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && join()}
          placeholder="e.g. 812 3456 7890"
          className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-zoom-blue focus:ring-2 focus:ring-blue-100"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        <p className="mt-3 text-xs text-gray-400">
          By joining, you agree to the Terms of Service and Privacy Statement.
        </p>

        <button
          onClick={join}
          disabled={loading || !value.trim()}
          className="mt-4 w-full rounded-lg bg-zoom-blue py-2.5 font-medium text-white transition hover:bg-zoom-bluehover disabled:opacity-60"
        >
          {loading ? "Validating…" : "Join"}
        </button>
      </div>
    </Modal>
  );
}
