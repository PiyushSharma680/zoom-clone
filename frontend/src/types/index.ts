export interface User {
  id: number;
  name: string;
  email: string;
  avatar_color: string;
}

export interface Host {
  id: number;
  name: string;
  avatar_color: string;
}

export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  description: string | null;
  meeting_type: "instant" | "scheduled";
  status: "scheduled" | "active" | "ended";
  scheduled_at: string | null;
  duration_minutes: number;
  passcode: string | null;
  created_at: string;
  host: Host;
  invite_link: string;
  participant_count: number;
}

export interface ChatMessage {
  from: string;
  peerId?: string;
  content: string;
  ts: string;
}

export interface RemotePeer {
  peerId: string;
  name: string;
  isHost: boolean;
  audioOn: boolean;
  videoOn: boolean;
  stream?: MediaStream;
}
