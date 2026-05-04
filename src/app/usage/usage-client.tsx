"use client";

import { UsageSummary } from "@/lib/gateway";
import { useRouter } from "next/navigation";

interface Props {
  data: UsageSummary;
}

const AGENT_COLORS: Record<string, string> = {
  helios: "#f59e0b",
  zeus: "#8b5cf6",
  hephaestus: "#ef4444",
  apollo: "#3b82f6",
  athena: "#10b981",
  hermes: "#f97316",
  demeter: "#84cc16",
  argus: "#06b6d4",
  main: "#6b7280",
};

function agentColor(agentId: string): string {
  return AGENT_COLORS[agentId.toLowerCase()] ?? "#6b7280";
}

function formatCost(usd: number): string {
  if (usd === 0) return "$0.00";
  if (usd < 0.0001) return `<$0.0001`;
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(4)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function UsageClient({ data }: Props) {
  const router = useRouter();

  const agentEntries = Object.entries(data.byAgent).sort(
    (a, b) => b[1].estimatedCostUsd - a[1].estimatedCostUsd
  );

  const maxTokens = Math.max(
    ...agentEntries.map(([, v]) => v.inputTokens + v.outputTokens),
    1
  );

  const maxCost = Math.max(
    ...agentEntries.map(([, v]) => v.estimatedCostUsd),
    0.0001
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-helios-amber">💰</span> Token Usage &amp; Cost
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Estimated spend per agent session · prices based on model list rates
          </p>
        </div>
        <button
          onClick={() => router.refresh()}
          className="rounded-lg border border-border-dim bg-surface px-3 py-1.5 text-xs font-mono text-muted-foreground hover:border-border-bright hover:text-foreground transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border-dim bg-surface p-5">
          <div className="text-xs font-mono text-muted-foreground tracking-wider mb-3">
            TOTAL INPUT TOKENS
          </div>
          <div className="text-2xl font-bold">{formatTokens(data.totalInputTokens)}</div>
          <div className="text-xs text-muted-foreground mt-1">across all active sessions</div>
        </div>

        <div className="rounded-xl border border-border-dim bg-surface p-5">
          <div className="text-xs font-mono text-muted-foreground tracking-wider mb-3">
            TOTAL OUTPUT TOKENS
          </div>
          <div className="text-2xl font-bold">{formatTokens(data.totalOutputTokens)}</div>
          <div className="text-xs text-muted-foreground mt-1">across all active sessions</div>
        </div>

        <div className="rounded-xl border border-border-dim bg-surface p-5">
          <div className="text-xs font-mono text-muted-foreground tracking-wider mb-3">
            ESTIMATED SPEND
          </div>
          <div className="text-2xl font-bold text-helios-amber">
            {formatCost(data.totalEstimatedCostUsd)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">list-rate proxy · github-copilot is flat-rate</div>
        </div>
      </div>

      {/* Per-Agent Breakdown */}
      <div className="rounded-xl border border-border-dim bg-surface p-5 mb-6">
        <div className="text-xs font-mono text-muted-foreground tracking-wider mb-6">
          COST BY AGENT
        </div>

        {agentEntries.length === 0 ? (
          <div className="text-sm text-muted-foreground">No session data with token usage found.</div>
        ) : (
          <div className="space-y-4">
            {agentEntries.map(([agentId, stats]) => {
              const totalTok = stats.inputTokens + stats.outputTokens;
              const barPct = (totalTok / maxTokens) * 100;
              const costBarPct = maxCost > 0 ? (stats.estimatedCostUsd / maxCost) * 100 : 0;
              const color = agentColor(agentId);
              return (
                <div key={agentId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-mono font-medium">{agentId}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {stats.model}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-muted-foreground">
                        ↑{formatTokens(stats.inputTokens)} ↓{formatTokens(stats.outputTokens)}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: stats.estimatedCostUsd > 0 ? color : undefined }}
                      >
                        {formatCost(stats.estimatedCostUsd)}
                      </span>
                    </div>
                  </div>
                  {/* Token bar */}
                  <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barPct}%`, backgroundColor: color, opacity: 0.7 }}
                    />
                  </div>
                  {/* Cost bar */}
                  {costBarPct > 0 && (
                    <div className="h-1 rounded-full bg-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${costBarPct}%`, backgroundColor: color }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Table */}
      <div className="rounded-xl border border-border-dim bg-surface p-5">
        <div className="text-xs font-mono text-muted-foreground tracking-wider mb-4">
          SESSION DETAIL
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border-dim">
                <th className="pb-2 pr-4 font-normal">AGENT</th>
                <th className="pb-2 pr-4 font-normal">MODEL</th>
                <th className="pb-2 pr-4 font-normal text-right">IN</th>
                <th className="pb-2 pr-4 font-normal text-right">OUT</th>
                <th className="pb-2 pr-4 font-normal text-right">CTX</th>
                <th className="pb-2 font-normal text-right">EST. COST</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions
                .sort((a, b) => b.estimatedCostUsd - a.estimatedCostUsd)
                .map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-border-dim/30 hover:bg-elevated/50 transition-colors"
                  >
                    <td className="py-1.5 pr-4">
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                        style={{ backgroundColor: agentColor(s.agentId) }}
                      />
                      {s.agentId}
                    </td>
                    <td className="py-1.5 pr-4 text-muted-foreground">{s.model}</td>
                    <td className="py-1.5 pr-4 text-right">{formatTokens(s.inputTokens)}</td>
                    <td className="py-1.5 pr-4 text-right">{formatTokens(s.outputTokens)}</td>
                    <td className="py-1.5 pr-4 text-right text-muted-foreground">
                      {formatTokens(s.totalTokens)}
                    </td>
                    <td
                      className="py-1.5 text-right font-semibold"
                      style={{ color: s.estimatedCostUsd > 0 ? agentColor(s.agentId) : undefined }}
                    >
                      {formatCost(s.estimatedCostUsd)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-4 text-[10px] text-muted-foreground font-mono">
        ⚠️ Cost estimates use public model list rates as a proxy. github-copilot is a flat subscription — these numbers reflect relative compute weight, not actual billing.
      </p>
    </div>
  );
}
