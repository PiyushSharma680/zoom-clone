import { Meeting, User } from "@/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

const TOKEN_KEY = "zc_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      detail = data.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------- Auth ----------
export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const api = {
  signup: (name: string, email: string, password: string) =>
    request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>("/api/auth/me"),

  listUsers: () => request<User[]>("/api/auth/users"),

  // ---------- Meetings ----------
  createInstant: (title?: string) =>
    request<Meeting>("/api/meetings", {
      method: "POST",
      body: JSON.stringify({ title: title || "Instant Meeting" }),
    }),

  schedule: (data: {
    title: string;
    description?: string;
    scheduled_at: string;
    duration_minutes: number;
  }) =>
    request<Meeting>("/api/meetings/schedule", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  upcoming: () => request<Meeting[]>("/api/meetings/upcoming"),
  recent: () => request<Meeting[]>("/api/meetings/recent"),
  allMeetings: () => request<Meeting[]>("/api/meetings/all"),

  deleteMeeting: (code: string) =>
    request<void>(`/api/meetings/${encodeURIComponent(code)}`, {
      method: "DELETE",
    }),

  validate: (code: string) =>
    request<{ exists: boolean; meeting: Meeting | null }>(
      `/api/meetings/validate?code=${encodeURIComponent(code)}`
    ),

  getMeeting: (code: string) =>
    request<Meeting>(`/api/meetings/${encodeURIComponent(code)}`),

  endMeeting: (code: string) =>
    request<Meeting>(`/api/meetings/${encodeURIComponent(code)}/end`, {
      method: "POST",
    }),
};
