"use client";

import { useState } from "react";
import type { DailyLog, CompanionFile, MemoryStats } from "@/lib/data/workspace";
import { toast } from "sonner";
import { Markdown } from "@/components/ui/markdown";

interface MemoryClientProps {
  dailyLogs: DailyLog[];
  longTermMemory: string;
  companionFiles: CompanionFile[];
  todayStats?: MemoryStats | null;
}

export function MemoryClient({ dailyLogs, longTermMemory, companionFiles, todayStats }: MemoryClientProps) {
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

      {/* Memory Stats Card */}
      {todayStats && (
        <div className="mb-6 rounded-xl border border-zeus-purple/30 bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-zeus-purple tracking-wider">📊 TODAY&apos;S CONSOLIDATION STATS</span>
            <span className="text-xs text-muted-foreground font-mono">{todayStats.date}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-void p-3">
              <div className="text-lg font-bold text-foreground">{todayStats.sessionsProcessed}</div>
              <div className="text-xs text-muted-foreground mt-0.5">sessions</div>
            </div>
            <div className="rounded-lg bg-void p-3">
              <div className="text-lg font-bold text-foreground">{todayStats.totalInputTokens.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-0.5">input tokens</div>
            </div>
            <div className="rounded-lg bg-void p-3">
              <div className="text-lg font-bold text-foreground">{todayStats.totalOutputTokens.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-0.5">output tokens</div>
            </div>
            <div className="rounded-lg bg-void p-3">
              <div className="text-lg font-bold text-green-400">${todayStats.estimatedCostUsd.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">est. cost</div>
            </div>
          </div>
          {todayStats.topicsExtracted.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-muted-foreground mb-1.5">topics</div>
              <div className="flex flex-wrap gap-1.5">
                {todayStats.topicsExtracted.map((t) => (
                  <span key={t} className="rounded-full bg-zeus-purple/10 px-2.5 py-0.5 text-xs text-zeus-purple border border-zeus-purple/20">{t}</span>
                ))}
              </div>
            </div>
          )}
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
          {/* Memory Timeline Bar Chart */}
          {dailyLogs.length > 1 && (
            <div className="rounded-xl border border-border-dim bg-surface p-4 mb-4">
              <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">MEMORY TIMELINE</div>
              <div className="flex items-end gap-1 h-16">
                {dailyLogs.slice().reverse().map((log) => {
                  const maxWords = Math.max(...dailyLogs.map((l) => l.wordCount));
                  const height = Math.max(8, (log.wordCount / maxWords) * 100);
                  const isExpanded = expandedLog === log.date;
                  return (
                    <button
                      key={log.date}
                      onClick={() => setExpandedLog(expandedLog === log.date ? null : log.date)}
                      className={`flex-1 rounded-t transition-all hover:opacity-80 ${
                        isExpanded ? "bg-zeus-purple" : "bg-helios-amber/40 hover:bg-helios-amber/60"
                      }`}
                      style={{ height: `${height}%` }}
                      title={`${log.date}: ${log.wordCount.toLocaleString()} words`}
                    />
                  );
                })}
              </div>
              <div className="flex gap-1 mt-1">
                {dailyLogs.slice().reverse().map((log) => (
                  <div key={log.date} className="flex-1 text-center font-mono text-[8px] text-muted-foreground/50 truncate">
                    {log.date.slice(5)}
                  </div>
                ))}
              </div>
            </div>
          )}

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
                  <div className="border-t border-border-dim bg-void/50">
                    {/* Section TOC for long logs */}
                    {log.wordCount > 200 && (() => {
                      const sections = log.content.split("\n").filter((l) => l.startsWith("## ")).map((l) => l.slice(3));
                      if (sections.length < 2) return null;
                      return (
                        <div className="px-5 pt-3 pb-1 border-b border-border-dim/50">
                          <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-1.5">SECTIONS</div>
                          <div className="flex flex-wrap gap-1.5 mb-1">
                            {sections.map((s, i) => (
                              <a
                                key={i}
                                href={`#section-${log.date}-${i}`}
                                className="rounded bg-elevated px-2 py-0.5 text-[10px] text-muted-foreground hover:text-zeus-purple hover:bg-zeus-purple/10 transition-colors"
                              >
                                {s}
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    <div className="px-5 py-4">
                      <MarkdownWithAnchors content={log.content} datePrefix={log.date} />
                    </div>
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

function MarkdownWithAnchors({ content, datePrefix }: { content: string; datePrefix: string }) {
  let sectionIdx = 0;
  const processed = content.replace(/^(## .+)$/gm, (match) => {
    const anchor = `<a id="section-${datePrefix}-${sectionIdx++}"></a>`;
    return `${anchor}\n${match}`;
  });
  return <Markdown content={processed} />;
}
