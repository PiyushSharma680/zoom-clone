"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";
import { api } from "@/lib/api";

/** Full-page Join screen (mirrors the Join modal) for direct /join visits. */
export default function JoinPage() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function extractCode(input: string) {
    const linkMatch = input.trim().match(/meeting\/(\d{11})/);
    if (linkMatch) return linkMatch[1];
    return input.replace(/\D/g, "");
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
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
        <div className="mb-5 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zoom-blue">
            <Video size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Join a Meeting</h1>
        </div>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && join()}
          placeholder="Meeting ID or invite link"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-zoom-blue focus:ring-2 focus:ring-blue-100"
        />
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        <button
          onClick={join}
          disabled={loading || !value.trim()}
          className="mt-4 w-full rounded-lg bg-zoom-blue py-2.5 font-medium text-white hover:bg-zoom-bluehover disabled:opacity-60"
        >
          {loading ? "Validating…" : "Join"}
        </button>
      </div>
    </div>
  );
}
