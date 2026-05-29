"use client";

import { useState, useEffect, useRef, useCallback } from "react";

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
  pending?: boolean;
  streaming?: boolean;
  streamText?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const GW_WS = "ws://127.0.0.1:18789";
const LS_AGENT_KEY = "chat:selectedAgent";
const LS_SESSION_KEY = "chat:selectedSession";
const LS_WIDGET_OPEN = "chat-widget:open";
const LS_WIDGET_SIZE = "chat-widget:size";

// ── Helpers ───────────────────────────────────────────────────────────────

function shortKey(key: string) {
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

// ── Markdown renderer ─────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderMarkdown(text: string): string {
  // Escape raw HTML first (security)
  let out = escapeHtml(text);

  // Fenced code blocks (``` ... ```) — process before other patterns
  out = out.replace(/```[\w]*\n?([\s\S]*?)```/g, (_m, code) => {
    return `<pre><code>${code.trimEnd()}</code></pre>`;
  });

  // Headings
  out = out.replace(/^### (.+)$/gm, "<h5>$1</h5>");
  out = out.replace(/^## (.+)$/gm, "<h4>$1</h4>");
  out = out.replace(/^# (.+)$/gm, "<h3>$1</h3>");

  // Bold **text**
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Italic *text* or _text_
  out = out.replace(/\*(.+?)\*/g, "<em>$1</em>");
  out = out.replace(/_(.+?)_/g, "<em>$1</em>");

  // Inline code `code`
  out = out.replace(/`([^`\n]+)`/g, "<code>$1</code>");

  // Links [text](url)
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Unordered lists
  out = out.replace(/((?:^[-*] .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((l) => `<li>${l.replace(/^[-*] /, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  out = out.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block
      .trim()
      .split("\n")
      .map((l) => `<li>${l.replace(/^\d+\. /, "")}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Double newline → paragraph break, single newline → <br>
  out = out.replace(/\n\n/g, "<br><br>");
  out = out.replace(/(?<!>)\n(?!<)/g, "<br>");

  return out;
}

// ── Styles ────────────────────────────────────────────────────────────────

const STYLES = `
  .cw-widget {
    --cw-bg: var(--background, #08080f);
    --cw-surface: var(--surface, #0d0d14);
    --cw-elevated: var(--elevated, #13131f);
    --cw-border: var(--border-dim, rgba(255,255,255,0.07));
    --cw-border-strong: rgba(255,255,255,0.12);
    --cw-fg: var(--foreground, #e5e7eb);
    --cw-muted: var(--muted-foreground, #6b7280);
    --cw-purple: var(--zeus-purple, #a855f7);
    --cw-green: #22c55e;
    --cw-red: #ef4444;
  }

  .cw-bubble {
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    z-index: 9998;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: opacity 0.2s ease;
  }

  .cw-bubble-btn {
    position: relative;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--cw-purple, #a855f7);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 24px rgba(168,85,247,0.35);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    flex-shrink: 0;
  }

  .cw-bubble-btn:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 32px rgba(168,85,247,0.5);
  }

  .cw-bubble-label {
    background: var(--cw-surface, #0d0d14);
    color: var(--cw-purple, #a855f7);
    border: 1px solid rgba(168,85,247,0.3);
    border-radius: 6px;
    padding: 4px 10px;
    font-family: monospace;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.05em;
    opacity: 0;
    pointer-events: none;
    transform: translateX(6px);
    transition: opacity 0.15s ease, transform 0.15s ease;
    white-space: nowrap;
  }

  .cw-bubble:hover .cw-bubble-label {
    opacity: 1;
    transform: translateX(0);
  }

  .cw-online-dot {
    position: absolute;
    bottom: 3px;
    right: 3px;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--cw-green, #22c55e);
    border: 2px solid var(--cw-bg, #08080f);
  }

  .cw-online-dot::before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: var(--cw-green, #22c55e);
    opacity: 0.4;
    animation: cw-ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
  }

  @keyframes cw-ping {
    75%, 100% { transform: scale(2); opacity: 0; }
  }

  .cw-badge {
    position: absolute;
    top: -3px;
    right: -3px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 9px;
    background: var(--cw-red, #ef4444);
    color: #fff;
    font-family: monospace;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--cw-bg, #08080f);
    pointer-events: none;
  }

  .cw-panel {
    position: fixed;
    bottom: 5.5rem;
    right: 1.5rem;
    z-index: 9999;
    width: 380px;
    height: 520px;
    display: flex;
    flex-direction: column;
    background: var(--cw-bg, #08080f);
    border: 1px solid var(--cw-border-strong, rgba(255,255,255,0.12));
    border-radius: 14px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.1);
    overflow: hidden;
    transform-origin: bottom right;
  }

  .cw-panel-enter {
    animation: cw-open 0.2s ease forwards;
  }

  .cw-panel-exit {
    animation: cw-close 0.18s ease forwards;
  }

  @keyframes cw-open {
    from { opacity: 0; transform: scale(0.92) translateY(8px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }

  @keyframes cw-close {
    from { opacity: 1; transform: scale(1)    translateY(0); }
    to   { opacity: 0; transform: scale(0.92) translateY(8px); }
  }

  .cw-resize-handle {
    position: absolute;
    top: 0;
    left: 0;
    width: 20px;
    height: 20px;
    cursor: nw-resize;
    z-index: 10;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 3px 0 0 3px;
    color: var(--cw-muted, #6b7280);
    font-size: 11px;
    line-height: 1;
    opacity: 0.45;
    transition: opacity 0.15s, color 0.15s;
    user-select: none;
    border-radius: 14px 0 0 0;
  }

  .cw-resize-handle:hover {
    opacity: 1;
    color: var(--cw-purple, #a855f7);
  }

  .cw-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--cw-surface, #0d0d14);
    border-bottom: 1px solid var(--cw-border, rgba(255,255,255,0.07));
    flex-shrink: 0;
    flex-wrap: wrap;
    row-gap: 4px;
  }

  .cw-title {
    font-family: monospace;
    font-size: 10px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--cw-muted, #6b7280);
    flex-shrink: 0;
  }

  .cw-select {
    border: 1px solid rgba(255,255,255,0.1);
    background: var(--cw-elevated, #13131f);
    color: var(--cw-fg, #e5e7eb);
    font-family: monospace;
    font-size: 11px;
    padding: 3px 6px;
    border-radius: 6px;
    max-width: 130px;
    min-width: 60px;
    cursor: pointer;
    outline: none;
  }

  .cw-select:focus {
    border-color: rgba(168,85,247,0.4);
    box-shadow: 0 0 0 1px rgba(168,85,247,0.2);
  }

  .cw-header-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .cw-icon-btn {
    background: none;
    border: none;
    color: var(--cw-muted, #6b7280);
    cursor: pointer;
    padding: 3px 5px;
    border-radius: 5px;
    font-size: 13px;
    line-height: 1;
    transition: background 0.1s, color 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cw-icon-btn:hover {
    background: rgba(255,255,255,0.07);
    color: var(--cw-fg, #e5e7eb);
  }

  .cw-error {
    padding: 6px 12px;
    background: rgba(239,68,68,0.06);
    border-bottom: 1px solid rgba(239,68,68,0.25);
    font-family: monospace;
    font-size: 11px;
    color: var(--cw-red, #ef4444);
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  .cw-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    scroll-behavior: smooth;
  }

  .cw-messages::-webkit-scrollbar {
    width: 4px;
  }

  .cw-messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .cw-messages::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 2px;
  }

  .cw-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: monospace;
    font-size: 11px;
    color: var(--cw-muted, #6b7280);
    text-align: center;
    padding: 24px;
  }

  .cw-msg-row {
    display: flex;
  }

  .cw-msg-row.user { justify-content: flex-end; }
  .cw-msg-row.assistant { justify-content: flex-start; }
  .cw-msg-row.system { justify-content: center; }

  .cw-msg-bubble {
    max-width: 80%;
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 13px;
    line-height: 1.5;
    word-break: break-word;
  }

  .cw-msg-bubble.user {
    background: rgba(168,85,247,0.15);
    border: 1px solid rgba(168,85,247,0.25);
    color: var(--cw-fg, #e5e7eb);
    white-space: pre-wrap;
  }

  .cw-msg-bubble.assistant {
    background: var(--cw-elevated, #13131f);
    border: 1px solid var(--cw-border, rgba(255,255,255,0.07));
    color: var(--cw-fg, #e5e7eb);
  }

  .cw-msg-bubble.assistant pre {
    background: #0a0a12;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    padding: 8px 10px;
    margin: 6px 0;
    overflow-x: auto;
    font-size: 11px;
  }

  .cw-msg-bubble.assistant code {
    font-family: monospace;
    font-size: 11px;
    background: rgba(0,0,0,0.3);
    border-radius: 3px;
    padding: 1px 4px;
  }

  .cw-msg-bubble.assistant pre code {
    background: transparent;
    padding: 0;
    font-size: 11px;
  }

  .cw-msg-bubble.assistant h3,
  .cw-msg-bubble.assistant h4,
  .cw-msg-bubble.assistant h5 {
    font-weight: 700;
    margin: 8px 0 3px 0;
    color: var(--cw-fg, #e5e7eb);
  }

  .cw-msg-bubble.assistant h3 { font-size: 14px; }
  .cw-msg-bubble.assistant h4 { font-size: 13px; }
  .cw-msg-bubble.assistant h5 { font-size: 12px; }

  .cw-msg-bubble.assistant ul,
  .cw-msg-bubble.assistant ol {
    padding-left: 18px;
    margin: 4px 0;
  }

  .cw-msg-bubble.assistant ul { list-style: disc; }
  .cw-msg-bubble.assistant ol { list-style: decimal; }

  .cw-msg-bubble.assistant li {
    margin: 2px 0;
  }

  .cw-msg-bubble.assistant a {
    color: var(--cw-purple, #a855f7);
    text-decoration: none;
  }

  .cw-msg-bubble.assistant a:hover {
    text-decoration: underline;
  }

  .cw-msg-bubble.system {
    background: rgba(26,26,46,0.7);
    font-family: monospace;
    font-size: 10px;
    color: var(--cw-muted, #6b7280);
    padding: 3px 8px;
    border-radius: 6px;
    max-width: 100%;
  }

  .cw-msg-meta {
    font-family: monospace;
    font-size: 10px;
    margin-bottom: 3px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .cw-msg-meta.user { color: rgba(168,85,247,0.6); }
  .cw-msg-meta.assistant { color: rgba(34,197,94,0.6); }

  .cw-cursor {
    display: inline-block;
    animation: cw-blink 1s step-end infinite;
    opacity: 0.5;
  }

  @keyframes cw-blink {
    50% { opacity: 0; }
  }

  .cw-input-bar {
    border-top: 1px solid var(--cw-border, rgba(255,255,255,0.07));
    background: var(--cw-surface, #0d0d14);
    padding: 8px 10px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .cw-input-row {
    display: flex;
    gap: 6px;
    align-items: flex-end;
  }

  .cw-textarea {
    flex: 1;
    resize: none;
    background: var(--cw-elevated, #13131f);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--cw-fg, #e5e7eb);
    font-family: monospace;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 8px;
    outline: none;
    min-height: 34px;
    max-height: 100px;
    overflow-y: auto;
    line-height: 1.45;
    field-sizing: content;
  }

  .cw-textarea::placeholder {
    color: var(--cw-muted, #6b7280);
  }

  .cw-textarea:focus {
    border-color: rgba(168,85,247,0.4);
    box-shadow: 0 0 0 1px rgba(168,85,247,0.2);
  }

  .cw-textarea:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .cw-send-btn {
    background: rgba(168,85,247,0.12);
    border: 1px solid rgba(168,85,247,0.3);
    color: var(--cw-purple, #a855f7);
    font-family: monospace;
    font-size: 11px;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    height: 34px;
    flex-shrink: 0;
    transition: background 0.1s, border-color 0.1s;
    white-space: nowrap;
  }

  .cw-send-btn:hover:not(:disabled) {
    background: rgba(168,85,247,0.22);
    border-color: rgba(168,85,247,0.5);
  }

  .cw-send-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .cw-footer-hint {
    font-family: monospace;
    font-size: 10px;
    color: var(--cw-muted, #6b7280);
  }

  /* Mobile */
  @media (max-width: 480px) {
    .cw-panel {
      width: 95vw;
      height: 80vh;
      right: 2.5vw;
      bottom: 5rem;
    }

    .cw-resize-handle {
      display: none;
    }
  }
`;

// ── ChatWidget ─────────────────────────────────────────────────────────────

export function ChatWidget() {
  // Panel state
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [unread, setUnread] = useState(0);

  // Selection
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Panel size (resize)
  const [panelSize, setPanelSize] = useState<{ width: number; height: number } | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const streamBufferRef = useRef<string>("");
  const toolCallBufferRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  // ── Persist open state + size ───────────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(LS_WIDGET_OPEN);
    if (saved === "true") setOpen(true);

    const savedSize = localStorage.getItem(LS_WIDGET_SIZE);
    if (savedSize) {
      try {
        const parsed = JSON.parse(savedSize) as { width: number; height: number };
        if (parsed.width && parsed.height) setPanelSize(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  // ── Resize drag logic ───────────────────────────────────────────────────
  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (window.innerWidth < 480) return;
    e.preventDefault();
    e.stopPropagation();

    const panel = panelRef.current;
    if (!panel) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = panel.offsetWidth;
    const startH = panel.offsetHeight;

    const minW = 300, minH = 400;
    const maxW = Math.floor(window.innerWidth * 0.9);
    const maxH = Math.floor(window.innerHeight * 0.9);

    function onMove(me: MouseEvent) {
      const dw = startX - me.clientX;
      const dh = startY - me.clientY;
      const newW = Math.min(maxW, Math.max(minW, startW + dw));
      const newH = Math.min(maxH, Math.max(minH, startH + dh));
      const size = { width: newW, height: newH };
      setPanelSize(size);
      localStorage.setItem(LS_WIDGET_SIZE, JSON.stringify(size));
    }

    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, []);

  // ── Scroll to bottom ────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    if (!openRef.current && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.role === "assistant" && !last.streaming) {
        setUnread((n) => n + 1);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  // ── Load agents ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingAgents(true);
      try {
        const res = await fetch("/api/chat/agents");
        const data = await res.json() as { agents: Agent[] };
        setAgents(data.agents ?? []);
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

  // ── Load sessions ───────────────────────────────────────────────────────
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

        const savedKey = localStorage.getItem(LS_SESSION_KEY);
        const mainSession = list.find(
          (s) =>
            s.key.includes("main") ||
            s.key === `agent:${selectedAgent}:main`
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

  // ── Load history ────────────────────────────────────────────────────────
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

  // ── Gateway WS ──────────────────────────────────────────────────────────
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
          toolName?: string;
          result?: unknown;
        };

        if (msg.type === "run.delta" && msg.runId === activeRunIdRef.current) {
          const chunk = msg.delta ?? msg.text ?? "";
          streamBufferRef.current += chunk;
          const buf = streamBufferRef.current;
          setMessages((prev) => {            const last = prev[prev.length - 1];
            if (last?.streaming) {
              return [...prev.slice(0, -1), { ...last, streamText: buf }];
            }
            return prev;
          });
        }

        if (msg.type === "run.tool_call" && msg.runId === activeRunIdRef.current) {
          toolCallBufferRef.current += (toolCallBufferRef.current ? ", " : "") + (msg.toolName ?? "tool");
        }

        if (msg.type === "run.complete" && msg.runId === activeRunIdRef.current) {
          const finalText = streamBufferRef.current;
          streamBufferRef.current = "";
          toolCallBufferRef.current = "";
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
          toolCallBufferRef.current = "";
          activeRunIdRef.current = null;
          setError(msg.error ?? "Run failed");
          setMessages((prev) => prev.filter((m) => !m.streaming));
          setSending(false);
        }
      } catch {
        // non-JSON frame — ignore
      }
    };

    ws.onerror = () => {};
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

  // ── Send ─────────────────────────────────────────────────────────────────
  async function send() {
    const text = input.trim();
    if (!text || !selectedSession || sending) return;

    setInput("");
    setError(null);
    setSending(true);

    setMessages((prev) => [...prev, { role: "user", content: text, ts: Date.now() }]);

    const runId = randomId();
    activeRunIdRef.current = runId;
    streamBufferRef.current = "";
    toolCallBufferRef.current = "";
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", streaming: true, streamText: "", ts: Date.now() },
    ]);

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
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { runId?: string; status?: string; error?: string };
      if (data.error) throw new Error(data.error);
    } catch (err) {
      activeRunIdRef.current = null;
      streamBufferRef.current = "";
      toolCallBufferRef.current = "";
      setMessages((prev) => prev.filter((m) => !m.streaming));
      setError(err instanceof Error ? err.message : "Send failed");
      setSending(false);
    }
  }

  function abort() {
    if (!activeRunIdRef.current) return;
    activeRunIdRef.current = null;
    streamBufferRef.current = "";
    toolCallBufferRef.current = "";
    setMessages((prev) => prev.filter((m) => !m.streaming));
    setSending(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function openPanel() {
    setOpen(true);
    setClosing(false);
    setUnread(0);
    localStorage.setItem(LS_WIDGET_OPEN, "true");
  }

  function closePanel() {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
      localStorage.setItem(LS_WIDGET_OPEN, "false");
    }, 180);
  }

  function togglePanel() {
    if (open) closePanel();
    else openPanel();
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const panelStyle = panelSize
    ? ({ width: `${panelSize.width}px`, height: `${panelSize.height}px` } as React.CSSProperties)
    : undefined;

  return (
    <div className="cw-widget">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* ── Panel ── */}
      {(open || closing) && (
        <div
          ref={panelRef}
          className={`cw-panel ${closing ? "cw-panel-exit" : "cw-panel-enter"}`}
          style={panelStyle}
        >
          {/* Resize handle */}
          <div
            className="cw-resize-handle"
            onMouseDown={handleResizeMouseDown}
            title="Drag to resize"
          >
            ⤡
          </div>

          {/* Header */}
          <div className="cw-header">
            <span className="cw-title">💬 Chat</span>

            {/* Agent */}
            {loadingAgents ? (
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--cw-muted)" }}>…</span>
            ) : (
              <select
                className="cw-select"
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                disabled={sending}
                title="Agent"
              >
                {agents.length === 0 && <option value="">No agents</option>}
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            )}

            {/* Session */}
            {loadingSessions ? (
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "var(--cw-muted)" }}>…</span>
            ) : (
              <select
                className="cw-select"
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                disabled={sending || sessions.length === 0}
                title="Session"
              >
                {sessions.length === 0 && <option value="">No sessions</option>}
                {sessions.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.displayName && s.displayName !== s.key ? s.displayName : shortKey(s.key)}
                  </option>
                ))}
              </select>
            )}

            <div className="cw-header-actions">
              {/* Minimize */}
              <button
                className="cw-icon-btn"
                onClick={closePanel}
                title="Minimize"
                style={{ fontSize: 14, fontFamily: "monospace" }}
              >
                ⌃
              </button>
              {/* Close */}
              <button
                className="cw-icon-btn"
                onClick={closePanel}
                title="Close"
                style={{ fontSize: 13 }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="cw-error">
              ⚠ {error}
              <button
                onClick={() => setError(null)}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer", opacity: 0.7 }}
              >✕</button>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="cw-messages">
            {loadingHistory && (
              <div className="cw-empty">Loading history…</div>
            )}
            {!loadingHistory && !selectedSession && (
              <div className="cw-empty">Select an agent and session to begin</div>
            )}
            {!loadingHistory && selectedSession && messages.length === 0 && (
              <div className="cw-empty">No messages yet — start a conversation ↓</div>
            )}

            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const isSystem = msg.role === "system";
              const displayText = msg.streaming ? (msg.streamText ?? "") : msg.content;

              if (isSystem) {
                return (
                  <div key={i} className="cw-msg-row system">
                    <div className="cw-msg-bubble system">{msg.content}</div>
                  </div>
                );
              }

              return (
                <div key={i} className={`cw-msg-row ${msg.role}`}>
                  <div className={`cw-msg-bubble ${msg.role}`}>
                    <div className={`cw-msg-meta ${msg.role}`}>
                      <span>{isUser ? "YOU" : "AGENT"}</span>
                      {msg.ts && (
                        <span style={{ color: "var(--cw-muted)" }}>{formatTime(msg.ts)}</span>
                      )}
                      {msg.streaming && (
                        <span style={{ color: "var(--cw-purple)", animation: "cw-blink 1s step-end infinite" }}>●</span>
                      )}
                    </div>
                    {isUser ? (
                      displayText
                        ? displayText
                        : msg.streaming
                        ? <span className="cw-cursor">▋</span>
                        : ""
                    ) : (
                      displayText
                        ? <span dangerouslySetInnerHTML={{ __html: renderMarkdown(displayText) }} />
                        : msg.streaming
                        ? <span className="cw-cursor">▋</span>
                        : ""
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="cw-input-bar">
            <div className="cw-input-row">
              <textarea
                className="cw-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={!selectedSession || sending}
                placeholder={
                  !selectedSession
                    ? "Select a session…"
                    : sending
                    ? "Waiting for response…"
                    : "Message… (Enter to send)"
                }
                rows={1}
                style={{ height: "34px" } as React.CSSProperties}
              />
              {sending ? (
                <button className="cw-send-btn" onClick={abort} style={{ borderColor: "rgba(239,68,68,0.4)", color: "#ef4444", background: "rgba(239,68,68,0.08)" }}>
                  ✕ Abort
                </button>
              ) : (
                <button
                  className="cw-send-btn"
                  onClick={send}
                  disabled={!input.trim() || !selectedSession}
                >
                  Send ↵
                </button>
              )}
            </div>
            <div className="cw-footer-hint">
              {selectedSession
                ? <span>Session: <span style={{ color: "rgba(168,85,247,0.7)" }}>{shortKey(selectedSession)}</span></span>
                : "No session selected"}
            </div>
          </div>
        </div>
      )}

      {/* ── Bubble ── */}
      <div className="cw-bubble" onClick={togglePanel}>
        <div
          className="cw-bubble-btn"
          role="button"
          aria-label={open ? "Close chat" : "Open chat"}
        >
          <span role="img" aria-label="chat">{open ? "✕" : "💬"}</span>
          <span className="cw-online-dot" />
          {!open && unread > 0 && (
            <span className="cw-badge">{unread > 9 ? "9+" : unread}</span>
          )}
        </div>
        {!open && <span className="cw-bubble-label">Chat</span>}
      </div>
    </div>
  );
}
