"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Mail, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";
import { api } from "@/lib/api";
import { User } from "@/types";

export default function ContactsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [starting, setStarting] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setUsers(await api.listUsers());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function startWith(u: User) {
    setStarting(u.id);
    try {
      const meeting = await api.createInstant(`Meeting with ${u.name}`);
      router.push(`/meeting/${meeting.meeting_code.replace(/\s/g, "")}?host=1`);
    } catch {
      setStarting(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell>
      <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
      <p className="mt-1 text-sm text-gray-500">
        Your team directory. Start an instant meeting with anyone.
      </p>

      <div className="relative mt-6 max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts…"
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-zoom-blue focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
            No contacts found.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 transition hover:shadow-card"
              >
                <div className="relative">
                  <Avatar name={u.name} color={u.avatar_color} size={44} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-gray-900">
                    {u.name}
                  </div>
                  <div className="flex items-center gap-1 truncate text-xs text-gray-500">
                    <Mail size={11} /> {u.email}
                  </div>
                </div>
                <button
                  onClick={() => startWith(u)}
                  disabled={starting === u.id}
                  className="flex items-center gap-1.5 rounded-lg bg-zoom-blue px-3 py-2 text-sm font-medium text-white hover:bg-zoom-bluehover disabled:opacity-60"
                >
                  <Video size={15} />
                  {starting === u.id ? "…" : "Meet"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
