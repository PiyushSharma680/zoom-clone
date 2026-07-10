"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Video, Settings, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Avatar from "./Avatar";

/** Top navigation bar matching Zoom's web app header. */
export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-2"
        aria-label="Home"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zoom-blue">
          <Video size={18} className="text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight text-zoom-blue">
          zoom<span className="text-gray-400 font-normal"> clone</span>
        </span>
      </button>

      <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
        {[
          { label: "Home", href: "/" },
          { label: "Meetings", href: "/meetings" },
          { label: "Contacts", href: "/contacts" },
          { label: "Whiteboards", href: "/whiteboards" },
        ].map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={active ? "text-zoom-blue" : "text-gray-600 hover:text-zoom-blue"}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/settings")}
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-gray-100"
          >
            <Avatar
              name={user?.name || "Guest"}
              color={user?.avatar_color}
              size={32}
            />
            <ChevronDown size={16} className="text-gray-500" />
          </button>

          {menuOpen && (
            <div className="animate-fade absolute right-0 mt-2 w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-modal">
              <div className="flex items-center gap-3 border-b border-gray-100 px-2 pb-3 pt-1">
                <Avatar
                  name={user?.name || "Guest"}
                  color={user?.avatar_color}
                  size={40}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {user?.name || "Guest"}
                  </div>
                  <div className="truncate text-xs text-gray-500">
                    {user?.email || "Not signed in"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <UserIcon size={16} /> Profile
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/settings");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings size={16} /> Settings
              </button>
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
