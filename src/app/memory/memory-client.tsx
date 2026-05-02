"use client";

import { useState } from "react";
import type { DailyLog, CompanionFile } from "@/lib/data/workspace";
import { toast } from "sonner";
import { Markdown } from "@/components/ui/markdown";

interface MemoryClientProps {
  dailyLogs: DailyLog[];
  longTermMemory: string;
  companionFiles: CompanionFile[];
}

export function MemoryClient({ dailyLogs, longTermMemory, companionFiles }: MemoryClientProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "longterm" | "companions">("daily");
  const [expandedLog, setExpandedLog] = useState<string | null>(dailyLogs[0]?.date || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleQuickNote = async () => {
    if (!noteText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Note saved to ${data.file}`);
        setNoteText("");
        setShowQuickNote(false);
      } else {
        toast.error("Failed to save note");
      }
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const filteredLogs = searchQuery
    ? dailyLogs.filter((log) => log.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : dailyLogs;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🧠 Memory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {dailyLogs.length} daily logs · {dailyLogs.reduce((s, l) => s + l.wordCount, 0).toLocaleString()} words total
          </p>
        </div>
        <button
          onClick={() => setShowQuickNote(!showQuickNote)}
          className="rounded-lg bg-zeus-purple px-4 py-2 text-sm font-medium text-white hover:bg-zeus-purple/80 transition-colors"
        >
          + Quick Note
        </button>
      </div>

      {/* Quick Note Form */}
      {showQuickNote && (
        <div className="mb-6 rounded-xl border border-zeus-purple/30 bg-surface p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zeus-purple tracking-wider">
              QUICK NOTE → today&apos;s daily log
            </span>
            <button onClick={() => setShowQuickNote(false)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
          </div>
          <textarea
            placeholder="What should Helios remember? This will be appended to today's daily memory log..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border-dim bg-void px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none resize-none font-mono"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowQuickNote(false)} className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            <button
              onClick={handleQuickNote}
              disabled={!noteText.trim() || saving}
              className="rounded-md bg-zeus-purple px-4 py-1.5 text-xs font-medium text-white hover:bg-zeus-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search memory..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border-dim bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none focus:ring-1 focus:ring-zeus-purple font-mono"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-surface p-1 w-fit">
        {(["daily", "longterm", "companions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-zeus-purple/20 text-zeus-purple"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "daily" ? "Daily Logs" : tab === "longterm" ? "Long-Term" : "Companion Files"}
          </button>
        ))}
      </div>

      {/* Daily Logs */}
      {activeTab === "daily" && (
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="rounded-xl border border-border-dim bg-surface p-8 text-center text-muted-foreground">
              {searchQuery ? "No matching logs found" : "No daily logs yet"}
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.date}
                className="rounded-xl border border-border-dim bg-surface overflow-hidden transition-colors hover:border-border-bright"
              >
                <button
                  onClick={() => setExpandedLog(expandedLog === log.date ? null : log.date)}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-mono text-sm font-semibold text-helios-amber">
                      {log.date}
                    </span>
                    <span className="rounded-full bg-elevated px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {log.wordCount.toLocaleString()} words
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {expandedLog === log.date ? "▼" : "▶"}
                  </span>
                </button>
                {expandedLog === log.date && (
                  <div className="border-t border-border-dim px-5 py-4 bg-void/50">
                    <Markdown content={log.content} />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Long-Term Memory */}
      {activeTab === "longterm" && (
        <div className="rounded-xl border border-border-dim bg-surface p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-xs text-muted-foreground tracking-wider">MEMORY.md</span>
            <span className="rounded-full bg-helios-amber/10 px-2 py-0.5 text-[10px] font-mono text-helios-amber">
              LONG-TERM
            </span>
          </div>
          <Markdown content={longTermMemory} />
        </div>
      )}

      {/* Companion Files */}
      {activeTab === "companions" && (
        <div className="space-y-3">
          {companionFiles.map((cf) => (
            <CompanionCard key={cf.filename} file={cf} />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanionCard({ file }: { file: CompanionFile }) {
  const [expanded, setExpanded] = useState(false);

  const colorMap: Record<string, string> = {
    Identity: "text-helios-amber",
    Soul: "text-zeus-purple",
    User: "text-status-scheduled",
    Agents: "text-status-online",
    Tools: "text-hephaestus-red",
    Plan: "text-status-oneshot",
  };

  return (
    <div className="rounded-xl border border-border-dim bg-surface overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-3 text-left"
      >
        <span className={`font-mono text-sm font-semibold ${colorMap[file.name] || "text-foreground"}`}>
          {file.filename}
        </span>
        <span className="rounded-full bg-elevated px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {file.wordCount} words
        </span>
        <span className="ml-auto text-muted-foreground text-xs">{expanded ? "▼" : "▶"}</span>
      </button>
      {expanded && (
        <div className="border-t border-border-dim px-5 py-4 bg-void/50">
          <Markdown content={file.content} />
        </div>
      )}
    </div>
  );
}
