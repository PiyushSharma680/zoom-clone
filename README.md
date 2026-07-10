# Zoom Clone — Video Conferencing Platform

A full-stack, production-style clone of the Zoom web app. Create instant
meetings, schedule future ones, join by ID or invite link, and run real
video meetings with WebRTC — camera/mic, screen share, in-meeting chat,
participants panel, and host controls (mute all / remove participant).

Built for the SDE Fullstack assignment. UI, UX, and workflows are modelled
closely on Zoom's web client.

---

## Tech Stack

| Layer     | Technology                                                      |
| --------- | --------------------------------------------------------------- |
| Frontend  | Next.js 14 (App Router, TypeScript), Tailwind CSS, lucide-react |
| Real-time | Native WebRTC (mesh) + WebSocket signaling                      |
| Backend   | Python, FastAPI, WebSockets, SQLAlchemy 2.0                     |
| Database  | SQLite                                                          |
| Auth      | JWT (python-jose) + bcrypt (passlib)                            |

---

## Features

**Core**

- **Landing dashboard** — Zoom-style home with navbar, profile/settings menu,
  New / Join / Schedule / Share tiles, live clock & greeting, **Upcoming** and
  **Recent** meeting sections.
- **Instant meeting** — one click creates a meeting with a unique 11-digit
  Meeting ID + shareable invite link, then drops you into the room.
- **Join meeting** — by Meeting ID _or_ pasted invite link, with server-side
  validation and a display-name / device-check lobby.
- **Schedule meeting** — title, description, date & time, duration; auto-generated
  link; stored in the DB and surfaced under Upcoming.

**Bonus (all implemented)**

- **Responsive design** — mobile, tablet, desktop.
- **Authentication** — login / signup with JWT; a default seeded account.
- **Host controls** — mute all, remove participant.

**Meeting room extras**

- Real camera/mic via `getUserMedia`, mesh WebRTC peer connections.
- Gallery grid that adapts to participant count, mirrored self-view.
- Screen sharing, mic/cam toggles with live broadcast of state.
- In-meeting chat (persisted to SQLite), participants panel, meeting timer,
  copy-invite, connection status.

---

## Project Structure

```
zoom-clone/
├── backend/                 # FastAPI + SQLite
│   ├── app/
│   │   ├── main.py          # app entry, CORS, router wiring
│   │   ├── config.py        # env-based settings
│   │   ├── database.py      # engine + session
│   │   ├── models.py        # SQLAlchemy schema
│   │   ├── schemas.py       # Pydantic request/response models
│   │   ├── auth.py          # JWT + password hashing
│   │   ├── utils.py         # meeting-code + serialisation helpers
│   │   ├── ws_manager.py    # in-memory room/peer connection manager
│   │   ├── seed.py          # sample data seeder
│   │   └── routers/
│   │       ├── auth.py       # /api/auth/*
│   │       ├── meetings.py   # /api/meetings/*
│   │       └── signaling.py  # /ws/{code} WebSocket
│   ├── requirements.txt
│   └── run.sh
└── frontend/                # Next.js (App Router)
    └── src/
        ├── app/             # routes: /, /login, /signup, /join, /meeting/[id]
        ├── components/      # Navbar, modals, meeting room UI
        ├── lib/             # api client, auth context, useMeeting (WebRTC)
        └── types/
```

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for full architecture, data-flow,
and workflow diagrams.

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A modern browser (Chrome/Edge/Firefox) — camera/mic permission needed.

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed          # creates zoom_clone.db + sample data
uvicorn app.main:app --reload --port 8000
```

API runs at `http://localhost:8000` · interactive docs at `http://localhost:8000/docs`.

> Shortcut: `bash run.sh` does all of the above.

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### Default login (seeded)

```
Email:    alex@zoomclone.dev
Password: ZoomDemo2026!
```

The login form is pre-filled — just click **Sign In**. You can also create a
new account from the Sign Up page.

---

## Testing a Real Meeting

1. Sign in and click **New Meeting** → **Start Meeting**.
2. Copy the invite link.
3. Open it in a **second browser / incognito window / another device on the
   same network**, enter a name, and join.
4. You'll see each other's video, can chat, share screen, and (as host) mute
   all or remove the other participant.

> WebRTC uses a full-mesh topology with public STUN servers, ideal for small
> meetings. For participants on different networks behind strict NATs, a TURN
> server would be added (see ARCHITECTURE.md → Scaling notes).

---

## Environment Variables

**backend/.env** (optional — sensible defaults provided)

```
SECRET_KEY=...            # JWT signing key
DATABASE_URL=sqlite:///./zoom_clone.db
FRONTEND_URL=https://zoom-clone-teal-five.vercel.app
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://zoom-clone-teal-five.vercel.app
```

**frontend/.env.local**

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## Deployment

- **Backend** → Render / Railway (run `uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
  Set `FRONTEND_URL` to the deployed frontend URL and keep `CORS_ORIGINS` in sync
  with the deployed frontend origin(s). For persistent chat/meetings across restarts,
  mount a disk for the SQLite file (or point `DATABASE_URL` at Postgres).
- **Frontend** → Vercel. Set `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` to the
  deployed backend (use `wss://` for the WebSocket URL over HTTPS).

---

## Assumptions

- **Default user**: per the brief, a default seeded user (`alex@zoomclone.dev`)
  is available and auto-filled. Full auth is implemented as a bonus, but you're
  never forced through it to demo core features.
- **Meeting IDs** are unique 11-digit codes displayed Zoom-style (`812 3456 7890`).
  Both spaced and unspaced forms are accepted when joining.
- **Signaling state** (who is currently in a room) lives in memory since it's
  ephemeral; meetings, users, and chat history are persisted in SQLite.
- **Mesh WebRTC** is used (no media server), which is appropriate for the
  small-meeting scope of this assignment.
- A meeting is marked `ended` when the host clicks **End**; ended meetings can't
  be joined and appear under Recent.

---

## Database Schema (summary)

- **users** — accounts (name, email, hashed_password, avatar_color).
- **meetings** — instant/scheduled meetings; FK `host_id → users`.
- **participants** — join records; FK `meeting_id → meetings`, `user_id → users`.
- **chat_messages** — in-meeting messages; FK `meeting_id → meetings`.

Full ER diagram and relationships in **[ARCHITECTURE.md](./ARCHITECTURE.md)**.
