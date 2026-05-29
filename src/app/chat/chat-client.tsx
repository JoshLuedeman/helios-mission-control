"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────

interface Agent {
  id: string;
  label: string;
  model: string | null;
}

interface Session {
  key: string;
  kind: string;
  displayName: string;
  chatType: string;
  updatedAt: number;
  status: string;
  model: string | null;
  totalTokens: number;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  ts?: number;
  model?: string;
  // local-only for optimistic / streaming
  pending?: boolean;
  streaming?: boolean;
  streamText?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const GW_WS = "ws://127.0.0.1:18789";
const LS_AGENT_KEY = "chat:selectedAgent";
const LS_SESSION_KEY = "chat:selectedSession";

// ── Helpers ───────────────────────────────────────────────────────────────

function shortKey(key: string) {
  // "agent:main:main" → "main · main"
  const parts = key.split(":");
  if (parts.length >= 3) return parts.slice(2).join(":");
  return key;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Dropdown ──────────────────────────────────────────────────────────────

function Select<T extends { id?: string; key?: string; label?: string; displayName?: string }>({
  items,
  value,
  onChange,
  getKey,
  getLabel,
  placeholder,
  disabled,
}: {
  items: T[];
  value: string;
  onChange: (v: string) => void;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "rounded-md border border-[rgba(255,255,255,0.1)] bg-[#13131f] px-2 py-1.5",
        "font-mono text-xs text-[#e5e7eb] focus:outline-none focus:ring-1 focus:ring-[#a855f7]/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "max-w-[220px] truncate"
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {items.map((item) => (
        <option key={getKey(item)} value={getKey(item)}>
          {getLabel(item)}
        </option>
      ))}
    </select>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export function ChatClient() {
  // Selection state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WS
  const wsRef = useRef<WebSocket | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const streamBufferRef = useRef<string>("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Scroll to bottom ────────────────────────────────────────────────────

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // ── Load agents on mount ─────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      setLoadingAgents(true);
      try {
        const res = await fetch("/api/chat/agents");
        const data = await res.json() as { agents: Agent[] };
        setAgents(data.agents ?? []);

        // Restore or default agent
        const saved = localStorage.getItem(LS_AGENT_KEY);
        const first = data.agents[0]?.id ?? "";
        const initial = data.agents.find((a) => a.id === saved)?.id ?? first;
        setSelectedAgent(initial);
      } catch {
        setError("Failed to load agents");
      } finally {
        setLoadingAgents(false);
      }
    }
    load();
  }, []);

  // ── Load sessions when agent changes ─────────────────────────────────────

  useEffect(() => {
    if (!selectedAgent) return;
    localStorage.setItem(LS_AGENT_KEY, selectedAgent);
    setSessions([]);
    setSelectedSession("");

    async function load() {
      setLoadingSessions(true);
      try {
        const res = await fetch(`/api/chat/sessions?agentId=${encodeURIComponent(selectedAgent)}`);
        const data = await res.json() as { sessions: Session[] };
        const list = data.sessions ?? [];
        setSessions(list);

        // Restore or default session
        const savedKey = localStorage.getItem(LS_SESSION_KEY);
        // Prefer "main" session key or saved key, then first
        const mainSession = list.find(
          (s) => s.key === `agent:${selectedAgent}:main` || s.key === "agent:main:main"
        );
        const savedSession = list.find((s) => s.key === savedKey);
        const picked = savedSession?.key ?? mainSession?.key ?? list[0]?.key ?? "";
        setSelectedSession(picked);
      } catch {
        setError("Failed to load sessions");
      } finally {
        setLoadingSessions(false);
      }
    }
    load();
  }, [selectedAgent]);

  // ── Load history when session changes ────────────────────────────────────

  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }
    localStorage.setItem(LS_SESSION_KEY, selectedSession);

    async function load() {
      setLoadingHistory(true);
      setMessages([]);
      try {
        const res = await fetch(
          `/api/chat/history?sessionKey=${encodeURIComponent(selectedSession)}&limit=80`
        );
        const data = await res.json() as { messages: ChatMessage[] };
        setMessages(data.messages ?? []);
      } catch {
        setError("Failed to load history");
      } finally {
        setLoadingHistory(false);
      }
    }
    load();
  }, [selectedSession]);

  // ── Gateway WS connection ────────────────────────────────────────────────

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return wsRef.current;

    const ws = new WebSocket(GW_WS);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string) as {
          type: string;
          runId?: string;
          text?: string;
          delta?: string;
          error?: string;
          result?: unknown;
        };

        if (msg.type === "run.delta" && msg.runId === activeRunIdRef.current) {
          const chunk = msg.delta ?? msg.text ?? "";
          streamBufferRef.current += chunk;
          const buf = streamBufferRef.current;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.streaming) {
              return [...prev.slice(0, -1), { ...last, streamText: buf }];
            }
            return prev;
          });
        }

        if (msg.type === "run.complete" && msg.runId === activeRunIdRef.current) {
          const finalText = streamBufferRef.current;
          streamBufferRef.current = "";
          activeRunIdRef.current = null;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.streaming) {
              return [
                ...prev.slice(0, -1),
                {
                  role: "assistant",
                  content: finalText || (last.streamText ?? ""),
                  streaming: false,
                  streamText: undefined,
                  ts: Date.now(),
                },
              ];
            }
            return prev;
          });
          setSending(false);
        }

        if (msg.type === "run.error" && msg.runId === activeRunIdRef.current) {
          streamBufferRef.current = "";
          activeRunIdRef.current = null;
          setError(msg.error ?? "Run failed");
          setMessages((prev) => prev.filter((m) => !m.streaming));
          setSending(false);
        }
      } catch {
        // non-JSON frame — ignore
      }
    };

    ws.onerror = () => {
      // Silently handle; will reconnect on next send
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
    };

    return ws;
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connectWs]);

  // ── Send message ─────────────────────────────────────────────────────────

  async function send() {
    const text = input.trim();
    if (!text || !selectedSession || sending) return;

    setInput("");
    setError(null);
    setSending(true);

    // Optimistic user message
    setMessages((prev) => [...prev, { role: "user", content: text, ts: Date.now() }]);

    // Streaming placeholder
    const runId = randomId();
    activeRunIdRef.current = runId;
    streamBufferRef.current = "";
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", streaming: true, streamText: "", ts: Date.now() },
    ]);

    // Ensure WS open for streaming
    connectWs();

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionKey: selectedSession,
          message: text,
          idempotencyKey: runId,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json() as { runId?: string; status?: string; error?: string };
      if (data.error) throw new Error(data.error);
      // The gateway uses our idempotencyKey as the runId for streaming events
    } catch (err) {
      activeRunIdRef.current = null;
      streamBufferRef.current = "";
      setMessages((prev) => prev.filter((m) => !m.streaming));
      setError(err instanceof Error ? err.message : "Send failed");
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col bg-[#08080f]">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.07)] bg-[#0d0d14] px-4 py-2.5 shrink-0 flex-wrap">
        <span className="font-mono text-[10px] tracking-widest text-[#6b7280] uppercase shrink-0">
          💬 Chat
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Agent dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-[#6b7280] shrink-0">Agent</span>
            {loadingAgents ? (
              <span className="font-mono text-[10px] text-[#6b7280]">loading…</span>
            ) : (
              <Select
                items={agents}
                value={selectedAgent}
                onChange={setSelectedAgent}
                getKey={(a) => a.id}
                getLabel={(a) => a.label}
                placeholder="Select agent…"
                disabled={sending}
              />
            )}
          </div>

          {/* Session dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-[#6b7280] shrink-0">Session</span>
            {loadingSessions ? (
              <span className="font-mono text-[10px] text-[#6b7280]">loading…</span>
            ) : (
              <Select
                items={sessions}
                value={selectedSession}
                onChange={setSelectedSession}
                getKey={(s) => s.key}
                getLabel={(s) =>
                  s.displayName && s.displayName !== s.key
                    ? s.displayName
                    : shortKey(s.key)
                }
                placeholder="Select session…"
                disabled={sending || sessions.length === 0}
              />
            )}
          </div>
        </div>

        {/* Session meta */}
        {selectedSession && sessions.length > 0 && (() => {
          const sess = sessions.find((s) => s.key === selectedSession);
          if (!sess) return null;
          return (
            <div className="ml-auto flex items-center gap-3 shrink-0">
              {sess.totalTokens > 0 && (
                <span className="font-mono text-[10px] text-[#6b7280]">
                  {sess.totalTokens.toLocaleString()} tok
                </span>
              )}
              {sess.model && (
                <span className="rounded bg-[#1a1a2e] px-1.5 py-0.5 font-mono text-[9px] text-[#a855f7]">
                  {sess.model.split("/").pop()}
                </span>
              )}
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  sess.status === "running" ? "bg-[#22c55e] animate-pulse" : "bg-[#6b7280]"
                )}
              />
            </div>
          );
        })()}
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="border-b border-[#ef4444]/30 bg-[#ef4444]/5 px-4 py-2 font-mono text-xs text-[#ef4444]">
          ⚠ {error}{" "}
          <button
            onClick={() => setError(null)}
            className="ml-2 opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Message list ─────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 px-4 py-4"
      >
        {loadingHistory && (
          <div className="py-12 text-center font-mono text-xs text-[#6b7280]">
            Loading history…
          </div>
        )}

        {!loadingHistory && messages.length === 0 && selectedSession && (
          <div className="py-12 text-center font-mono text-xs text-[#6b7280]">
            No messages yet — start a conversation ↓
          </div>
        )}

        {!loadingHistory && !selectedSession && (
          <div className="py-12 text-center font-mono text-xs text-[#6b7280]">
            Select an agent and session to begin
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
      </div>

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className="border-t border-[rgba(255,255,255,0.07)] bg-[#0d0d14] p-3 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={!selectedSession || sending}
            placeholder={
              !selectedSession
                ? "Select a session to chat…"
                : sending
                ? "Waiting for response…"
                : "Message… (Enter to send, Shift+Enter for newline)"
            }
            rows={1}
            className={cn(
              "flex-1 resize-none rounded-lg border border-[rgba(255,255,255,0.1)]",
              "bg-[#13131f] px-3 py-2 font-mono text-sm text-[#e5e7eb] placeholder:text-[#6b7280]",
              "focus:border-[#a855f7]/40 focus:outline-none focus:ring-1 focus:ring-[#a855f7]/30",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "min-h-[40px] max-h-[120px] overflow-y-auto"
            )}
            style={{ height: "40px", fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={send}
            disabled={!input.trim() || !selectedSession || sending}
            className={cn(
              "shrink-0 rounded-lg border border-[#a855f7]/30 bg-[#a855f7]/10 px-3 py-2",
              "font-mono text-xs text-[#a855f7] transition-all",
              "hover:bg-[#a855f7]/20 hover:border-[#a855f7]/50",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              "h-[40px]"
            )}
          >
            {sending ? "⏳" : "Send ↵"}
          </button>
        </div>
        <div className="mt-1.5 font-mono text-[10px] text-[#6b7280]">
          {selectedSession ? (
            <span>
              Session:{" "}
              <span className="text-[#a855f7]/70">{shortKey(selectedSession)}</span>
            </span>
          ) : (
            "No session selected"
          )}
        </div>
      </div>
    </div>
  );
}

// ── MessageBubble ────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const isSystem = msg.role === "system";
  const displayText = msg.streaming ? (msg.streamText ?? "") : msg.content;

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded bg-[#1a1a2e] px-2 py-0.5 font-mono text-[10px] text-[#6b7280]">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-[#a855f7]/15 border border-[#a855f7]/25 text-[#e5e7eb]"
            : "bg-[#13131f] border border-[rgba(255,255,255,0.07)] text-[#e5e7eb]"
        )}
      >
        {/* Role label */}
        <div
          className={cn(
            "mb-1 font-mono text-[10px] tracking-wider",
            isUser ? "text-[#a855f7]/60" : "text-[#22c55e]/60"
          )}
        >
          {isUser ? "YOU" : "AGENT"}
          {msg.ts && (
            <span className="ml-2 text-[#6b7280]">{formatTime(msg.ts)}</span>
          )}
          {msg.streaming && (
            <span className="ml-2 animate-pulse text-[#a855f7]">●</span>
          )}
        </div>

        {/* Content */}
        <div className="whitespace-pre-wrap break-words">
          {displayText || (msg.streaming ? <span className="animate-pulse opacity-50">▋</span> : "")}
        </div>
      </div>
    </div>
  );
}
