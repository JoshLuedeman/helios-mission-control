"use client";

import { useState, useEffect } from "react";
import type { CronJob } from "@/lib/data/workspace";
import { formatCronExpression } from "@/lib/format";

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium ${
        enabled
          ? "bg-status-online/10 text-status-online"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {enabled ? "ACTIVE" : "DISABLED"}
    </span>
  );
}

function TypeBadge({ kind }: { kind: string }) {
  const colors: Record<string, string> = {
    birthday: "bg-status-oneshot/10 text-status-oneshot",
    anniversary: "bg-status-oneshot/10 text-status-oneshot",
    email: "bg-status-scheduled/10 text-status-scheduled",
    default: "bg-zeus-purple/10 text-zeus-purple",
  };

  const inferType = (name: string) => {
    if (name.includes("birthday")) return "birthday";
    if (name.includes("anniversary")) return "anniversary";
    if (name.includes("email")) return "email";
    return "default";
  };

  const type = inferType(kind);
  const label = type === "default" ? "RECURRING" : type.toUpperCase();

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-medium ${colors[type] || colors.default}`}>
      {label}
    </span>
  );
}

export function CalendarClient({ cronJobs }: { cronJobs: CronJob[] }) {
  const [filter, setFilter] = useState<"all" | "active" | "disabled">("all");
  const [calRange, setCalRange] = useState<"today" | "tomorrow" | "week">("today");
  const [calEvents, setCalEvents] = useState<CalendarEvent[]>([]);
  const [calLoading, setCalLoading] = useState(true);
  const [calError, setCalError] = useState<string | null>(null);

  useEffect(() => {
    setCalLoading(true);
    setCalError(null);
    fetch(`/api/calendar?range=${calRange}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setCalError(data.error);
          setCalEvents([]);
        } else {
          setCalEvents(data.events || []);
        }
      })
      .catch((err) => setCalError(err.message))
      .finally(() => setCalLoading(false));
  }, [calRange]);

  const filtered = cronJobs.filter((job) => {
    if (filter === "active") return job.enabled;
    if (filter === "disabled") return !job.enabled;
    return true;
  });

  const activeCount = cronJobs.filter((j) => j.enabled).length;
  const disabledCount = cronJobs.length - activeCount;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">📅 Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {cronJobs.length} cron jobs · {activeCount} active · {disabledCount} disabled
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-1 rounded-lg bg-surface p-1 w-fit">
        {(["all", "active", "disabled"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-zeus-purple/20 text-zeus-purple"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? `All (${cronJobs.length})` : f === "active" ? `Active (${activeCount})` : `Disabled (${disabledCount})`}
          </button>
        ))}
      </div>

      {/* Cron Jobs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider mb-2">
          ⏱ CRON JOBS
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border-dim bg-surface p-8 text-center text-muted-foreground">
            No cron jobs match the filter
          </div>
        ) : (
          filtered.map((job) => (
            <CronJobCard key={job.id} job={job} />
          ))
        )}
      </div>

      {/* Calendar Events */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground tracking-wider">
            📆 CALENDAR EVENTS
          </div>
          <div className="flex gap-1 rounded-lg bg-surface p-1">
            {(["today", "tomorrow", "week"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setCalRange(r)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  calRange === r
                    ? "bg-zeus-purple/20 text-zeus-purple"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {calLoading ? (
          <div className="rounded-xl border border-border-dim bg-surface p-8 text-center text-muted-foreground">
            <span className="animate-pulse">Loading calendar events…</span>
          </div>
        ) : calError ? (
          <div className="rounded-xl border border-destructive/30 bg-surface p-6 text-center">
            <p className="text-sm text-destructive">{calError}</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">Check ICS calendar skill configuration</p>
          </div>
        ) : calEvents.length === 0 ? (
          <div className="rounded-xl border border-border-dim bg-surface p-8 text-center text-muted-foreground">
            No events for {calRange}
          </div>
        ) : (
          <div className="space-y-2">
            {calEvents.map((event, i) => (
              <CalendarEventCard key={`${event.title}-${event.start}-${i}`} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CronJobCard({ job }: { job: CronJob }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border-dim bg-surface overflow-hidden transition-colors hover:border-border-bright">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 px-5 py-3.5 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold">{job.name}</span>
            <StatusBadge enabled={job.enabled} />
            <TypeBadge kind={job.name} />
          </div>
          <div className="text-xs text-muted-foreground">{job.description}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-xs text-status-scheduled">
            {job.schedule.expr}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
            {formatCronExpression(job.schedule.expr)}
          </div>
        </div>
        <span className="text-muted-foreground text-xs">{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="border-t border-border-dim px-5 py-4 bg-void/50 space-y-2 font-mono text-xs">
          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
            <div>
              <span className="text-muted-foreground">Agent:</span>{" "}
              <span className="text-helios-amber">{job.agentId}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Timezone:</span>{" "}
              <span>{job.schedule.tz}</span>
            </div>
            {job.model && (
              <div>
                <span className="text-muted-foreground">Model:</span>{" "}
                <span>{job.model}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">ID:</span>{" "}
              <span className="text-muted-foreground/80">{job.id.slice(0, 8)}…</span>
            </div>
          </div>

          {job.state && (
            <div className="mt-2 pt-2 border-t border-border-dim/50">
              <div className="text-[10px] text-muted-foreground tracking-wider mb-1">STATE</div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                {job.state.lastRunAtMs && (
                  <div>
                    <span className="text-muted-foreground">Last run:</span>{" "}
                    <span>{new Date(job.state.lastRunAtMs).toLocaleString()}</span>
                  </div>
                )}
                {job.state.lastRunStatus && (
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    <span className={job.state.lastRunStatus === "ok" ? "text-status-online" : "text-destructive"}>
                      {job.state.lastRunStatus}
                    </span>
                  </div>
                )}
                {job.state.nextRunAtMs && (
                  <div>
                    <span className="text-muted-foreground">Next run:</span>{" "}
                    <span>{new Date(job.state.nextRunAtMs).toLocaleDateString()}</span>
                  </div>
                )}
                {job.state.lastDurationMs != null && (
                  <div>
                    <span className="text-muted-foreground">Duration:</span>{" "}
                    <span>{(job.state.lastDurationMs / 1000).toFixed(1)}s</span>
                  </div>
                )}
                {job.state.consecutiveErrors != null && job.state.consecutiveErrors > 0 && (
                  <div>
                    <span className="text-muted-foreground">Errors:</span>{" "}
                    <span className="text-destructive">{job.state.consecutiveErrors}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CalendarEvent {
  title: string;
  calendar: string;
  allday: boolean;
  start: string;
  end: string;
  start_time: string;
  end_time: string;
  date: string;
  location: string | null;
}

function CalendarEventCard({ event }: { event: CalendarEvent }) {
  const calColors: Record<string, string> = {
    "Microsoft Work": "border-l-status-scheduled",
    "Personal": "border-l-helios-amber",
    "Microsoft Calendar": "border-l-status-scheduled",
  };
  const borderColor = calColors[event.calendar] || "border-l-zeus-purple";

  return (
    <div className={`rounded-lg border border-border-dim bg-surface p-3 pl-4 border-l-2 ${borderColor} transition-colors hover:bg-elevated`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{event.title}</div>
          {event.location && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">📍 {event.location}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          {event.allday ? (
            <span className="rounded-full bg-zeus-purple/10 px-2 py-0.5 text-[10px] font-mono text-zeus-purple">ALL DAY</span>
          ) : (
            <div className="font-mono text-xs text-foreground">
              {event.start_time} – {event.end_time}
            </div>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
          {event.calendar}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">{event.date}</span>
      </div>
    </div>
  );
}
