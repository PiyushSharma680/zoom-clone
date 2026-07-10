"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ActionButtons from "@/components/ActionButtons";
import MeetingList from "@/components/MeetingList";
import NewMeetingModal from "@/components/modals/NewMeetingModal";
import JoinModal from "@/components/modals/JoinModal";
import ScheduleModal from "@/components/modals/ScheduleModal";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Meeting } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [modal, setModal] = useState<null | "new" | "join" | "schedule">(null);
  const [upcoming, setUpcoming] = useState<Meeting[]>([]);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([api.upcoming(), api.recent()]);
      setUpcoming(u);
      setRecent(r);
    } catch {
      /* handled by auth guard */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) loadMeetings();
  }, [user, loadMeetings]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 18
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting}, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {now.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-semibold text-gray-800">
              {now.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        <ActionButtons
          onNew={() => setModal("new")}
          onJoin={() => setModal("join")}
          onSchedule={() => setModal("schedule")}
        />

        <MeetingList
          title="Upcoming Meetings"
          meetings={upcoming}
          loading={loading}
          emptyLabel="No upcoming meetings. Schedule one to get started."
        />

        <MeetingList
          title="Recent Meetings"
          meetings={recent}
          loading={loading}
          emptyLabel="No recent meetings yet."
        />
      </main>

      <NewMeetingModal open={modal === "new"} onClose={() => setModal(null)} />
      <JoinModal open={modal === "join"} onClose={() => setModal(null)} />
      <ScheduleModal
        open={modal === "schedule"}
        onClose={() => setModal(null)}
        onScheduled={loadMeetings}
      />
    </div>
  );
}
