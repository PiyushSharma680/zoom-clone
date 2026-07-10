"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { ChatMessage } from "@/types";

interface ChatPanelProps {
  messages: ChatMessage[];
  myName: string;
  onClose: () => void;
  onSend: (text: string) => void;
}

/** In-meeting chat side panel. */
export default function ChatPanel({
  messages,
  myName,
  onClose,
  onSend,
}: ChatPanelProps) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submit() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <aside className="flex h-full w-full flex-col bg-[#232333] text-white sm:w-80">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold">Chat</h3>
        <button onClick={onClose} className="rounded p-1 hover:bg-white/10">
          <X size={18} />
        </button>
      </div>

      <div className="scroll-thin flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <p className="mt-6 text-center text-xs text-gray-400">
            No messages yet. Say hello 👋
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.from === myName;
          return (
            <div key={i} className={`flex flex-col ${mine ? "items-end" : ""}`}>
              <span className="mb-0.5 text-[11px] text-gray-400">
                {mine ? "You" : m.from} ·{" "}
                {new Date(m.ts).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  mine
                    ? "rounded-br-sm bg-zoom-blue text-white"
                    : "rounded-bl-sm bg-white/10 text-gray-100"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Type a message…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
          <button
            onClick={submit}
            disabled={!text.trim()}
            className="text-zoom-blue disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
