# Architecture & Workflow

This document explains how the Zoom Clone is put together — the system
topology, the database design, and the end-to-end workflows for every core
feature. All diagrams are [Mermaid](https://mermaid.js.org/) and render
directly on GitHub.

---

## 1. System Overview

Three tiers: a Next.js **client**, a FastAPI **server**, and a SQLite
**database**. The client talks to the server over two channels — plain **HTTP
(REST)** for CRUD, and a **WebSocket** for real-time signaling. Actual audio/video
never touches the server: it flows **peer-to-peer** over WebRTC.

```mermaid
graph TB
    subgraph Client["🖥️ Browser (Next.js 14 · React · TS)"]
        UI["Dashboard / Modals / Auth"]
        Room["Meeting Room UI"]
        Hook["useMeeting() — WebRTC engine"]
        API["lib/api.ts (REST client)"]
    end

    subgraph Server["⚙️ FastAPI (Python)"]
        Auth["/api/auth/*  (JWT)"]
        Meet["/api/meetings/*"]
        WS["/ws/{code}  WebSocket signaling"]
        Mgr["ConnectionManager (in-memory rooms)"]
    end

    DB[("🗄️ SQLite\nusers · meetings\nparticipants · chat")]

    UI --> API
    Room --> Hook
    API -- "HTTP/JSON + Bearer JWT" --> Auth
    API -- "HTTP/JSON" --> Meet
    Hook -- "WS: offer/answer/ICE, chat, host ctrl" --> WS
    WS --> Mgr
    Auth --> DB
    Meet --> DB
    WS -. "persist chat" .-> DB

    Hook <== "WebRTC media (P2P, STUN)" ==> Hook2["Other participants"]
```

**Key idea:** the WebSocket server is only a *signaling relay + presence
tracker*. Once two browsers have exchanged SDP offers/answers and ICE
candidates through it, media streams directly between them.

---

## 2. Database Design

A normalized relational schema with four tables and clear ownership.

```mermaid
erDiagram
    USERS ||--o{ MEETINGS : "hosts"
    USERS ||--o{ PARTICIPANTS : "joins as"
    MEETINGS ||--o{ PARTICIPANTS : "has"
    MEETINGS ||--o{ CHAT_MESSAGES : "has"

    USERS {
        int id PK
        string name
        string email UK
        string hashed_password
        string avatar_color
        datetime created_at
    }
    MEETINGS {
        int id PK
        string meeting_code UK "11-digit, unique"
        string title
        text description
        int host_id FK
        string meeting_type "instant | scheduled"
        string status "scheduled | active | ended"
        datetime scheduled_at
        int duration_minutes
        string passcode
        datetime created_at
        datetime started_at
        datetime ended_at
    }
    PARTICIPANTS {
        int id PK
        int meeting_id FK
        int user_id FK "nullable (guest)"
        string display_name
        bool is_host
        datetime joined_at
        datetime left_at
    }
    CHAT_MESSAGES {
        int id PK
        int meeting_id FK
        string sender_name
        text content
        datetime created_at
    }
```

**Design decisions**
- `meeting_code` is the public identifier (unique, indexed); the integer `id`
  is the internal PK. This keeps public URLs opaque and DB joins fast.
- `meeting_type` vs `status` are separate axes: *type* is fixed at creation
  (instant/scheduled), *status* changes over the lifecycle (scheduled → active → ended).
- `participants.user_id` is nullable so **guests** (join by link without an
  account) are supported while still recording named attendance.
- Cascade deletes (`Meeting → Participants/Chat`) keep the DB consistent.

---

## 3. Core Workflows

### 3.1 Instant Meeting

```mermaid
sequenceDiagram
    actor Host
    participant FE as Next.js
    participant API as FastAPI
    participant DB as SQLite

    Host->>FE: Click "New Meeting"
    FE->>API: POST /api/meetings (Bearer JWT)
    API->>API: generate unique 11-digit code
    API->>DB: INSERT meeting (type=instant, status=active)
    DB-->>API: meeting row
    API-->>FE: { meeting_code, invite_link, ... }
    FE-->>Host: Show ID + invite link (copy)
    Host->>FE: Click "Start Meeting"
    FE->>FE: route → /meeting/{code}?host=1
```

### 3.2 Join Meeting (by ID or link)

```mermaid
sequenceDiagram
    actor Guest
    participant FE as Next.js
    participant API as FastAPI

    Guest->>FE: Enter Meeting ID / paste invite link
    FE->>FE: extract 11-digit code
    FE->>API: GET /api/meetings/validate?code=...
    alt exists & not ended
        API-->>FE: { exists: true, meeting }
        FE-->>Guest: Pre-join lobby (camera preview, name)
        Guest->>FE: Set name + devices, "Join Now"
        FE->>FE: mount MeetingRoom → open WebSocket
    else not found / ended
        API-->>FE: { exists: false }
        FE-->>Guest: "Meeting not found"
    end
```

### 3.3 Schedule Meeting

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js
    participant API as FastAPI
    participant DB as SQLite

    User->>FE: Fill title, description, date/time, duration
    FE->>API: POST /api/meetings/schedule
    API->>DB: INSERT meeting (type=scheduled, status=scheduled)
    API-->>FE: meeting + auto-generated invite_link
    FE-->>User: Confirmation + copyable link
    Note over FE: Dashboard refreshes → appears under "Upcoming"
    FE->>API: GET /api/meetings/upcoming
    API->>DB: SELECT scheduled, not ended, ORDER BY scheduled_at
```

---

## 4. Real-Time Meeting: WebRTC + Signaling

The most involved part. When a user joins, `useMeeting()` acquires local media
and opens a WebSocket. The server tells the newcomer who is already present; the
newcomer initiates a peer connection to each. Classic **mesh** topology.

```mermaid
sequenceDiagram
    participant B as Browser B (newcomer)
    participant WS as WebSocket Server
    participant A as Browser A (existing)

    B->>WS: connect /ws/{code}?peerId=B
    WS-->>B: existing-peers [A]
    WS-->>A: peer-joined {B}

    Note over B: For each existing peer →
    B->>B: new RTCPeerConnection, add local tracks
    B->>WS: offer (target=A)
    WS->>A: offer (from=B)
    A->>A: setRemoteDescription, createAnswer
    A->>WS: answer (target=B)
    WS->>B: answer (from=B)

    par ICE trickle (both directions)
        B->>WS: ice (target=A)
        WS->>A: ice (from=B)
        A->>WS: ice (target=B)
        WS->>B: ice (from=A)
    end

    Note over A,B: ✅ Direct P2P media stream established
    A-->>B: 🎥 audio/video (peer-to-peer, via STUN)
```

**Message protocol** (JSON over the WebSocket):

| Direction | `type` | Purpose |
| --- | --- | --- |
| C→S | `offer` / `answer` / `ice` | 1:1 WebRTC negotiation (relayed to `target`) |
| C→S | `chat` | Broadcast message (also persisted) |
| C→S | `media-state` | Broadcast mic/cam on/off |
| C→S | `host-mute-all` | Host asks everyone to mute |
| C→S | `host-remove` | Host removes a participant |
| S→C | `existing-peers` / `peer-joined` / `peer-left` | Presence |
| S→C | `force-mute` / `removed` | Host-control effects |

### 4.1 Host Controls

```mermaid
sequenceDiagram
    actor Host
    participant WS as WebSocket Server
    participant P as Participant

    rect rgb(240,246,255)
    Note over Host,P: Mute All
    Host->>WS: host-mute-all
    WS->>P: force-mute
    P->>P: disable local audio track
    P->>WS: media-state {audioOn:false}
    WS->>Host: media-state (P muted)
    end

    rect rgb(255,244,244)
    Note over Host,P: Remove Participant
    Host->>WS: host-remove {target:P}
    WS->>P: removed
    P->>P: leave meeting → redirect home
    WS->>Host: peer-left {P}
    end
```

Host authority is enforced **server-side**: `ws_manager` only honours
`host-mute-all` / `host-remove` when the sending peer connected with `host=true`.

---

## 5. Request Lifecycle & Auth

```mermaid
graph LR
    A["Login/Signup"] -->|"POST /api/auth"| B["FastAPI verifies\nbcrypt hash"]
    B -->|"issues JWT"| C["localStorage: zc_token"]
    C -->|"Authorization: Bearer"| D["Protected routes\n(get_current_user)"]
    D -->|"decode + load user"| E["Meeting endpoints"]
```

- Passwords hashed with **bcrypt**; never stored or returned in plaintext.
- JWT (HS256) carries the user id (`sub`), 7-day expiry.
- `AuthProvider` (React context) restores the session on load via `/api/auth/me`
  and guards the dashboard, redirecting to `/login` when unauthenticated.

---

## 6. Frontend Module Responsibilities

| Module | Responsibility |
| --- | --- |
| `app/page.tsx` | Dashboard: greeting, action tiles, upcoming/recent lists |
| `app/meeting/[id]/page.tsx` | Validate → pre-join lobby → mount room |
| `lib/api.ts` | Typed REST client, token storage, error normalisation |
| `lib/auth.tsx` | Auth context (login/signup/logout/session restore) |
| `lib/useMeeting.ts` | **WebRTC engine**: media, peer connections, signaling, chat, host controls, screen share |
| `components/modals/*` | New / Join / Schedule dialogs |
| `components/meeting/*` | VideoGrid, VideoTile, ControlBar, Participants, Chat, PreJoin, MeetingRoom |

Separation of concerns: **network/logic** lives in `lib/`, **presentation** in
`components/`, **routing/orchestration** in `app/`. Components are stateless
where possible and driven by props from the `useMeeting` hook.

---

## 7. Scaling Notes (beyond the assignment)

- **TURN server**: mesh + STUN works for most cases; add a TURN relay for peers
  behind symmetric NATs/strict firewalls.
- **SFU** (e.g. mediasoup/LiveKit): mesh is O(n²) connections. For meetings
  larger than ~6–8 participants, route media through a Selective Forwarding Unit
  so each client uploads once.
- **Database**: swap SQLite for Postgres via `DATABASE_URL`; the SQLAlchemy layer
  is unchanged.
- **Signaling presence**: move `ConnectionManager` state to Redis pub/sub to run
  multiple backend instances behind a load balancer.
- **Recording / transcription** would hook into the SFU media path.
