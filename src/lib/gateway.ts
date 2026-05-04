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

export interface SessionUsage {
  agentId: string;
  model: string;
  modelProvider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  updatedAt: number;
  kind: string;
}

export interface UsageSummary {
  sessions: SessionUsage[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEstimatedCostUsd: number;
  byAgent: Record<string, { inputTokens: number; outputTokens: number; estimatedCostUsd: number; model: string }>;
}

/**
 * Per-model pricing table (USD per 1M tokens).
 * Approximate public rates — github-copilot is subscription-based so we use
 * the underlying model list price as a proxy for relative cost weight.
 */
const MODEL_PRICING: Record<string, { inputPer1M: number; outputPer1M: number }> = {
  "claude-sonnet-4-6": { inputPer1M: 3.0, outputPer1M: 15.0 },
  "claude-sonnet-4-5": { inputPer1M: 3.0, outputPer1M: 15.0 },
  "claude-haiku-4-5": { inputPer1M: 0.8, outputPer1M: 4.0 },
  "claude-haiku-4-5-20251001": { inputPer1M: 0.8, outputPer1M: 4.0 },
  "claude-opus-4-7": { inputPer1M: 15.0, outputPer1M: 75.0 },
  "gpt-4o": { inputPer1M: 2.5, outputPer1M: 10.0 },
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6 },
  "gpt-5": { inputPer1M: 15.0, outputPer1M: 60.0 },
  "qwen3:8b": { inputPer1M: 0, outputPer1M: 0 },
  "llama3.1:8b": { inputPer1M: 0, outputPer1M: 0 },
};

function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing =
    MODEL_PRICING[model] ??
    Object.entries(MODEL_PRICING).find(([k]) => model.includes(k))?.[1] ??
    { inputPer1M: 3.0, outputPer1M: 15.0 };
  return (inputTokens / 1_000_000) * pricing.inputPer1M +
         (outputTokens / 1_000_000) * pricing.outputPer1M;
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

/**
 * Fetch all agent sessions with token usage data and estimated cost.
 * Cost is calculated client-side using a model pricing table since
 * github-copilot doesn't expose per-request billing.
 */
export function fetchSessionUsage(): UsageSummary {
  try {
    const raw = run("openclaw sessions --all-agents --json");
    const parsed = JSON.parse(raw) as Array<{
      agentId?: string;
      model?: string;
      modelProvider?: string;
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
      updatedAt?: number;
      kind?: string;
    }>;

    const sessions: SessionUsage[] = parsed
      .filter((s) => s.agentId != null && (s.inputTokens ?? 0) + (s.outputTokens ?? 0) > 0)
      .map((s) => {
        const model = s.model ?? "claude-sonnet-4-6";
        const inputTokens = s.inputTokens ?? 0;
        const outputTokens = s.outputTokens ?? 0;
        return {
          agentId: s.agentId!,
          model,
          modelProvider: s.modelProvider ?? "unknown",
          inputTokens,
          outputTokens,
          totalTokens: s.totalTokens ?? 0,
          estimatedCostUsd: estimateCost(model, inputTokens, outputTokens),
          updatedAt: s.updatedAt ?? 0,
          kind: s.kind ?? "unknown",
        };
      });

    const byAgent: UsageSummary["byAgent"] = {};
    for (const s of sessions) {
      if (!byAgent[s.agentId]) {
        byAgent[s.agentId] = { inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0, model: s.model };
      }
      byAgent[s.agentId].inputTokens += s.inputTokens;
      byAgent[s.agentId].outputTokens += s.outputTokens;
      byAgent[s.agentId].estimatedCostUsd += s.estimatedCostUsd;
    }

    return {
      sessions,
      totalInputTokens: sessions.reduce((a, s) => a + s.inputTokens, 0),
      totalOutputTokens: sessions.reduce((a, s) => a + s.outputTokens, 0),
      totalEstimatedCostUsd: sessions.reduce((a, s) => a + s.estimatedCostUsd, 0),
      byAgent,
    };
  } catch {
    return {
      sessions: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalEstimatedCostUsd: 0,
      byAgent: {},
    };
  }
}
