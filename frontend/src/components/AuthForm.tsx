"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Video } from "lucide-react";
import { useAuth } from "@/lib/auth";

/** Shared login / signup form. `mode` toggles between the two. */
export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { login, signup } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(
    mode === "login" ? "alex@zoomclone.dev" : ""
  );
  const [password, setPassword] = useState(
    mode === "login" ? "ZoomDemo2026!" : ""
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email, password);
      else await signup(name, email, password);
      router.replace("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-zoom-blue focus:ring-2 focus:ring-blue-100";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zoom-blue">
            <Video size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            {mode === "login" ? "Sign in to Zoom Clone" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {mode === "login"
              ? "Welcome back — join your meetings."
              : "Start hosting meetings in seconds."}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-card"
        >
          {mode === "signup" && (
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jane Doe"
                className={inputClass + " mt-1.5"}
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className={inputClass + " mt-1.5"}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className={inputClass + " mt-1.5"}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zoom-blue py-2.5 font-medium text-white transition hover:bg-zoom-bluehover disabled:opacity-60"
          >
            {loading
              ? "Please wait…"
              : mode === "login"
              ? "Sign In"
              : "Sign Up"}
          </button>

          {mode === "login" && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-center text-xs text-gray-500">
              Demo account pre-filled — just click Sign In.
            </p>
          )}
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>
              New here?{" "}
              <Link href="/signup" className="font-medium text-zoom-blue">
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-zoom-blue">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
