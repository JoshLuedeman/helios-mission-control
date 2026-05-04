"use client";

import { CronJob, CronRun, CronRunsResult } from "@/lib/gateway";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface Props {
  jobs: CronJob[];
  recentRuns: CronRunsResult;
  drillRuns: CronRunsResult | null;
  selectedJobId: string | null;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground font-mono text-[10px]">—</span>;
  const ok = status === "ok";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${
      ok ? "bg-status-online/10 text-status-online" : "bg-destructive/10 text-destructive"
    }`}>
      {ok ? "✓" : "✗"} {status}
    </span>
  );
}

function EnabledBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono ${
      enabled ? "bg-zeus-purple/10 text-zeus-purple" : "bg-elevated text-muted-foreground"
    }`}>
      {enabled ? "enabled" : "disabled"}
    </span>
  );
}

function formatDuration(ms: number | null): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function formatRelative(ms: number | null): string {
  if (!ms) return "—";
  const diff = ms - Date.now();
  const abs = Math.abs(diff);
  const sign = diff < 0 ? "ago" : "from now";
  if (abs < 60000) return `${Math.round(abs / 1000)}s ${sign}`;
  if (abs < 3600000) return `${Math.round(abs / 60000)}m ${sign}`;
  return `${Math.round(abs / 3600000)}h ${sign}`;
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// Count recent runs per job from the recentRuns list
function buildJobStats(jobs: CronJob[], runs: CronRun[]) {
  const stats: Record<string, { ok: number; error: number }> = {};
  for (const j of jobs) stats[j.id] = { ok: 0, error: 0 };
  for (const r of runs) {
    if (!stats[r.jobId]) stats[r.jobId] = { ok: 0, error: 0 };
    if (r.status === "ok") stats[r.jobId].ok++;
    else stats[r.jobId].error++;
  }
  return stats;
}

export function CronClient({ jobs, recentRuns, drillRuns, selectedJobId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "error">("all");
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const jobStats = buildJobStats(jobs, recentRuns.entries);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  const filteredJobs = jobs.filter((j) => {
    const matchName = j.name.toLowerCase().includes(filter.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "ok" && j.lastRunStatus === "ok") ||
      (statusFilter === "error" && j.lastRunStatus !== "ok" && j.lastRunStatus !== null);
    return matchName && matchStatus;
  });

  function selectJob(id: string) {
    if (selectedJobId === id) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?job=${id}`);
    }
    setExpandedRun(null);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-zeus-purple">🕐</span> Cron Jobs
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {jobs.length} jobs · {recentRuns.total} total runs logged
          </p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="rounded-lg border border-border-dim bg-surface px-3 py-1.5 text-xs font-mono text-muted-foreground hover:border-border-bright hover:text-foreground transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      <div className="flex gap-6">
        {/* Left: Job List */}
        <div className="w-80 shrink-0">
          {/* Filters */}
          <div className="flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder="Filter jobs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-lg border border-border-dim bg-surface px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-zeus-purple/50 focus:outline-none"
            />
            <div className="flex gap-1">
              {(["all", "ok", "error"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-mono transition-colors ${
                    statusFilter === s
                      ? "bg-zeus-purple text-white"
                      : "bg-surface border border-border-dim text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Job Cards */}
          <div className="space-y-2">
            {filteredJobs.map((job) => {
              const stats = jobStats[job.id];
              const isSelected = selectedJobId === job.id;
              return (
                <button
                  key={job.id}
                  onClick={() => selectJob(job.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-zeus-purple/50 bg-zeus-purple/5"
                      : "border-border-dim bg-surface hover:border-border-bright hover:bg-elevated"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-xs font-medium leading-tight">{job.name}</span>
                    <EnabledBadge enabled={job.enabled} />
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mb-1.5">{job.schedule}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={job.lastRunStatus} />
                    <span className="text-[10px] font-mono text-muted-foreground">{formatDuration(job.lastRunAtMs ? job.lastRunAtMs - (job.lastRunAtMs - (job.lastDurationMs ?? 0)) : null)}</span>
                  </div>
                  {stats && (stats.ok + stats.error) > 0 && (
                    <div className="mt-1.5 flex gap-2 text-[10px] font-mono">
                      <span className="text-status-online">{stats.ok} ok</span>
                      {stats.error > 0 && <span className="text-destructive">{stats.error} err</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="flex-1 min-w-0">
          {!selectedJob ? (
            /* Overview: recent runs across all jobs */
            <div className="rounded-xl border border-border-dim bg-surface p-5">
              <div className="text-xs font-mono text-muted-foreground tracking-wider mb-4">
                RECENT RUNS — ALL JOBS
              </div>
              <RunsTable
                runs={recentRuns.entries}
                expandedRun={expandedRun}
                setExpandedRun={setExpandedRun}
                showJobName
              />
            </div>
          ) : (
            /* Drill-down: selected job */
            <div className="space-y-4">
              {/* Job Header */}
              <div className="rounded-xl border border-border-dim bg-surface p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selectedJob.name}</h2>
                    <div className="text-xs font-mono text-muted-foreground mt-1">{selectedJob.schedule}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <EnabledBadge enabled={selectedJob.enabled} />
                    <StatusBadge status={selectedJob.lastRunStatus} />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <div className="text-muted-foreground mb-1">LAST RUN</div>
                    <div>{formatTime(selectedJob.lastRunAtMs)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">DURATION</div>
                    <div>{formatDuration(selectedJob.lastDurationMs)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">NEXT RUN</div>
                    <div>{formatRelative(selectedJob.nextRunAtMs)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">ERRORS</div>
                    <div className={selectedJob.consecutiveErrors > 0 ? "text-destructive" : ""}>
                      {selectedJob.consecutiveErrors} consecutive
                    </div>
                  </div>
                </div>
              </div>

              {/* Run History */}
              <div className="rounded-xl border border-border-dim bg-surface p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-mono text-muted-foreground tracking-wider">
                    RUN HISTORY
                    {drillRuns && <span className="ml-2 text-[10px]">({drillRuns.total} total)</span>}
                  </div>
                </div>
                <RunsTable
                  runs={drillRuns?.entries ?? []}
                  expandedRun={expandedRun}
                  setExpandedRun={setExpandedRun}
                  showJobName={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RunsTable({
  runs,
  expandedRun,
  setExpandedRun,
  showJobName,
}: {
  runs: CronRun[];
  expandedRun: string | null;
  setExpandedRun: (id: string | null) => void;
  showJobName: boolean;
}) {
  if (runs.length === 0) {
    return <div className="text-sm text-muted-foreground">No runs found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border-dim">
            {showJobName && <th className="pb-2 pr-4 font-normal">JOB</th>}
            <th className="pb-2 pr-4 font-normal">TIME</th>
            <th className="pb-2 pr-4 font-normal">STATUS</th>
            <th className="pb-2 pr-4 font-normal">DURATION</th>
            <th className="pb-2 pr-4 font-normal">MODEL</th>
            <th className="pb-2 font-normal text-right">TOKENS</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run, i) => {
            const runKey = `${run.jobId}-${run.runAtMs}-${i}`;
            const isExpanded = expandedRun === runKey;
            return (
              <>
                <tr
                  key={`row-${runKey}`}
                  className="border-b border-border-dim/30 hover:bg-elevated/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedRun(isExpanded ? null : runKey)}
                >
                  {showJobName && (
                    <td className="py-1.5 pr-4 text-muted-foreground truncate max-w-[140px]">{run.jobName}</td>
                  )}
                  <td className="py-1.5 pr-4 text-muted-foreground">{formatTime(run.runAtMs)}</td>
                  <td className="py-1.5 pr-4"><StatusBadge status={run.status} /></td>
                  <td className="py-1.5 pr-4">{formatDuration(run.durationMs)}</td>
                  <td className="py-1.5 pr-4 text-muted-foreground">{run.model ?? "—"}</td>
                  <td className="py-1.5 text-right">
                    {run.inputTokens + run.outputTokens > 0
                      ? `↑${formatTokens(run.inputTokens)} ↓${formatTokens(run.outputTokens)}`
                      : "—"}
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`drill-${runKey}`} className="bg-elevated/30">
                    <td colSpan={showJobName ? 6 : 5} className="px-4 py-3">
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px] mb-2">
                          <div><span className="text-muted-foreground">Session ID: </span>{run.sessionId ?? "—"}</div>
                          <div><span className="text-muted-foreground">Provider: </span>{run.provider ?? "—"}</div>
                        </div>
                        {run.summary && (
                          <div>
                            <div className="text-[10px] text-muted-foreground tracking-wider mb-1">OUTPUT</div>
                            <pre className="whitespace-pre-wrap text-[11px] text-foreground/90 bg-void rounded-lg p-3 leading-relaxed max-h-48 overflow-y-auto">
                              {run.summary}
                            </pre>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
