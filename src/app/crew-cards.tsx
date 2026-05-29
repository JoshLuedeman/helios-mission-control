"use client";

import { useEffect, useState } from "react";

interface AgentRow {
  id: string;
  name: string;
  emoji: string;
  title: string;
  colorHex: string;
  status: "online" | "idle" | "offline";
  lastActiveMs: number | null;
}

interface CronJobRow {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string;
  lastRunAtMs: number | null;
  lastRunStatus: string | null;
  nextRunAtMs: number | null;
  consecutiveErrors: number;
  lastDurationMs: number | null;
  model: string | null;
}

interface CrewData {
  agents: AgentRow[];
  cronJobs: CronJobRow[];
}

function statusDot(status: AgentRow["status"]) {
  if (status === "online") {
    return (
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-status-online" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-status-online" />
      </span>
    );
  }
  if (status === "idle") {
    return <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "#eab308" }} />;
  }
  return <span className="inline-flex h-2 w-2 rounded-full bg-destructive" />;
}

export function CrewStatusCard() {
  const [data, setData] = useState<CrewData | null>(null);
  const [gatewayOnline, setGatewayOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/crew");
        if (!res.ok) throw new Error("non-ok");
        const json: CrewData = await res.json();
        if (!cancelled) {
          setData(json);
          setGatewayOnline(true);
        }
      } catch {
        if (!cancelled) setGatewayOnline(false);
      }
    }

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-xl border border-border-dim bg-surface p-5">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
        CREW STATUS
      </div>
      {data == null ? (
        <div className="text-xs text-muted-foreground">Loading…</div>
      ) : (
        <div className="space-y-2">
          {data.agents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-2">
              {statusDot(agent.status)}
              <span className="text-sm font-medium">
                {agent.emoji} {agent.name}
              </span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground capitalize">
                {agent.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CronJobsCard({ fallbackCount }: { fallbackCount: number }) {
  const [data, setData] = useState<CrewData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/crew");
        if (!res.ok) throw new Error("non-ok");
        const json: CrewData = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // leave data null → show fallback
      }
    }

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const cronJobs = data?.cronJobs ?? null;
  const enabled = cronJobs?.filter((j) => j.enabled) ?? null;
  const errored = cronJobs?.filter((j) => j.consecutiveErrors > 0) ?? null;

  return (
    <div className="rounded-xl border border-border-dim bg-surface p-5">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
        ⏱ CRON JOBS
      </div>
      <div className="text-2xl font-bold">
        {enabled != null ? enabled.length : fallbackCount}
      </div>
      <div className="flex gap-3 text-[10px] font-mono">
        <span className="text-status-online">
          {enabled != null ? enabled.length : fallbackCount} active
        </span>
        {cronJobs != null && (
          <span className="text-muted-foreground">
            {cronJobs.length - (enabled?.length ?? 0)} disabled
          </span>
        )}
      </div>
      {errored != null && errored.length > 0 && (
        <div className="mt-2 space-y-1">
          {errored.map((j) => (
            <div
              key={j.id}
              className="text-[10px] font-mono text-destructive truncate"
            >
              ⚠ {j.name} ({j.consecutiveErrors} errors)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SystemCard({
  activeProjects,
  logCount,
}: {
  activeProjects: number;
  logCount: number;
}) {
  const [gatewayOnline, setGatewayOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/crew");
        if (!res.ok) throw new Error("non-ok");
        await res.json();
        if (!cancelled) setGatewayOnline(true);
      } catch {
        if (!cancelled) setGatewayOnline(false);
      }
    }

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-xl border border-border-dim bg-surface p-5">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
        ⚙️ SYSTEM
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Runtime</span>
          <span className="font-mono text-foreground">OpenClaw</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gateway</span>
          <span
            className={`font-mono ${
              gatewayOnline === null
                ? "text-muted-foreground"
                : gatewayOnline
                ? "text-status-online"
                : "text-destructive"
            }`}
          >
            {gatewayOnline === null
              ? "checking…"
              : gatewayOnline
              ? "online"
              : "offline"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Projects</span>
          <span className="font-mono text-foreground">
            {activeProjects} active
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Memory</span>
          <span className="font-mono text-foreground">{logCount} logs</span>
        </div>
      </div>
    </div>
  );
}

// ─── Weather Card ─────────────────────────────────────────────────────────────

interface WeatherData {
  tempF: number;
  feelsLikeF: number;
  description: string;
  humidity: number;
  windMph: number;
  emoji: string;
}

export function WeatherCard({ weather }: { weather: WeatherData | null }) {
  return (
    <div className="rounded-xl border border-border-dim bg-surface p-5">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
        🌤️ WEATHER · ORLANDO
      </div>
      {!weather ? (
        <div className="text-sm text-muted-foreground">Unavailable</div>
      ) : (
        <>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl">{weather.emoji}</span>
            <div>
              <div className="text-2xl font-bold">{weather.tempF}°F</div>
              <div className="text-xs text-muted-foreground">Feels like {weather.feelsLikeF}°</div>
            </div>
          </div>
          <div className="text-sm text-foreground/80 mb-2">{weather.description}</div>
          <div className="flex gap-3 text-[10px] font-mono text-muted-foreground">
            <span>💧 {weather.humidity}%</span>
            <span>💨 {weather.windMph} mph</span>
          </div>
        </>
      )}
    </div>
  );
}
