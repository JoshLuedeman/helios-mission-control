"use client";

import { useState } from "react";
import type { DailyLog, CompanionFile } from "@/lib/data/workspace";

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="prose-invert max-w-none space-y-1 font-mono text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return <h2 key={i} className="text-xl font-bold text-foreground mt-4 mb-2 font-sans">{line.slice(2)}</h2>;
        }
        if (line.startsWith("## ")) {
          return <h3 key={i} className="text-lg font-semibold text-helios-amber mt-3 mb-1 font-sans">{line.slice(3)}</h3>;
        }
        if (line.startsWith("### ")) {
          return <h4 key={i} className="text-sm font-semibold text-zeus-purple mt-2 mb-1 font-sans">{line.slice(4)}</h4>;
        }
        if (line.startsWith("- ")) {
          const text = line.slice(2);
          const isChecked = text.startsWith("[x] ");
          const isUnchecked = text.startsWith("[ ] ");
          if (isChecked || isUnchecked) {
            return (
              <div key={i} className="flex items-start gap-2 pl-2">
                <span className={isChecked ? "text-status-online" : "text-muted-foreground"}>
                  {isChecked ? "✓" : "○"}
                </span>
                <span className={isChecked ? "text-muted-foreground line-through" : "text-foreground"}>
                  {text.slice(4)}
                </span>
              </div>
            );
          }
          return (
            <div key={i} className="flex items-start gap-2 pl-2">
              <span className="text-zeus-purple/50">›</span>
              <span className="text-foreground/90">{text}</span>
            </div>
          );
        }
        if (line.startsWith("  - ")) {
          return (
            <div key={i} className="flex items-start gap-2 pl-6">
              <span className="text-muted-foreground/50">·</span>
              <span className="text-foreground/80">{line.slice(4)}</span>
            </div>
          );
        }
        if (line.trim() === "") {
          return <div key={i} className="h-2" />;
        }
        if (line.startsWith("---")) {
          return <hr key={i} className="border-border-dim my-3" />;
        }
        // Bold text
        const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>');
        if (formatted !== line) {
          return <div key={i} className="text-foreground/80" dangerouslySetInnerHTML={{ __html: formatted }} />;
        }
        return <div key={i} className="text-foreground/80">{line}</div>;
      })}
    </div>
  );
}

interface MemoryClientProps {
  dailyLogs: DailyLog[];
  longTermMemory: string;
  companionFiles: CompanionFile[];
}

export function MemoryClient({ dailyLogs, longTermMemory, companionFiles }: MemoryClientProps) {
  const [activeTab, setActiveTab] = useState<"daily" | "longterm" | "companions">("daily");
  const [expandedLog, setExpandedLog] = useState<string | null>(dailyLogs[0]?.date || null);
  const [searchQuery, setSearchQuery] = useState("");

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
      </div>

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
                    <MarkdownContent content={log.content} />
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
          <MarkdownContent content={longTermMemory} />
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
          <MarkdownContent content={file.content} />
        </div>
      )}
    </div>
  );
}
