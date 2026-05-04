/**
 * gateway.ts — Server-side helpers to fetch live data from the OpenClaw gateway.
 *
 * Uses CLI shell exec (not HTTP directly) to avoid auth token management in
 * client code. All functions return empty arrays on error so the dashboard
 * degrades gracefully.
 *
 * TODO: Future: add fetchAgentSessionHistory(agentId, limit) for per-agent
 * history view — openclaw sessions --agent <id> --json returns full session
 * list with timestamps.
 */

import { execSync } from "child_process";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string; // cron expression
  lastRunAtMs: number | null;
  lastRunStatus: string | null;
  nextRunAtMs: number | null;
  consecutiveErrors: number;
  lastDurationMs: number | null;
  model: string | null;
}

export interface AgentSession {
  agentId: string;
  updatedAt: number; // ms timestamp
}

// ── Helpers ────────────────────────────────────────────────────────────────

function run(cmd: string): string {
  return execSync(cmd, { timeout: 10_000, encoding: "utf-8" });
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Fetch all cron jobs from the OpenClaw gateway.
 * Maps the raw `cron.list` response into a flat, typed array.
 */
export function fetchCronJobs(): CronJob[] {
  try {
    const raw = run("openclaw gateway call cron.list --json");
    const parsed = JSON.parse(raw) as {
      jobs?: Array<{
        id?: string;
        name?: string;
        enabled?: boolean;
        schedule?: { expr?: string };
        state?: {
          lastRunAtMs?: number | null;
          lastRunStatus?: string | null;
          nextRunAtMs?: number | null;
          consecutiveErrors?: number;
          lastDurationMs?: number | null;
        };
        payload?: { model?: string | null };
      }>;
    };

    return (parsed.jobs ?? []).map((j) => ({
      id: j.id ?? "",
      name: j.name ?? "",
      enabled: j.enabled ?? false,
      schedule: j.schedule?.expr ?? "",
      lastRunAtMs: j.state?.lastRunAtMs ?? null,
      lastRunStatus: j.state?.lastRunStatus ?? null,
      nextRunAtMs: j.state?.nextRunAtMs ?? null,
      consecutiveErrors: j.state?.consecutiveErrors ?? 0,
      lastDurationMs: j.state?.lastDurationMs ?? null,
      model: j.payload?.model ?? null,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch recent agent sessions from the OpenClaw gateway.
 * @param activeMinutes — only return sessions updated within this window (default 120 min)
 */
export function fetchAgentSessions(activeMinutes = 120): AgentSession[] {
  try {
    const raw = run(
      `openclaw sessions --all-agents --active ${activeMinutes} --json`
    );
    const parsed = JSON.parse(raw) as Array<{
      agentId?: string;
      updatedAt?: number;
    }>;

    return parsed
      .filter((s) => s.agentId != null)
      .map((s) => ({
        agentId: s.agentId!,
        updatedAt: s.updatedAt ?? 0,
      }));
  } catch {
    return [];
  }
}
