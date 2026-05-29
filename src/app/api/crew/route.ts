import { NextResponse } from "next/server";
import { fetchCronJobs, fetchAgentSessions } from "@/lib/gateway";
import { agents, computeAgentStatus } from "@/lib/agents.config";

export const dynamic = "force-dynamic";

export async function GET() {
  const [cronJobs, sessions] = await Promise.all([
    Promise.resolve(fetchCronJobs()),
    Promise.resolve(fetchAgentSessions(120)),
  ]);

  // Build per-agent status from live session data
  const agentData = agents.map((a) => {
    // Helios is the host machine — online whenever the gateway is reachable
    const effectiveId = a.id === "helios" ? "main" : a.id;
    const status = computeAgentStatus(effectiveId, sessions);
    const agentSessions = sessions
      .filter((s) => s.agentId === effectiveId)
      .sort((x, y) => y.updatedAt - x.updatedAt);
    const lastActiveMs = agentSessions[0]?.updatedAt ?? null;

    return {
      id: a.id,
      name: a.name,
      emoji: a.emoji,
      title: a.title,
      colorHex: a.colorHex,
      status,
      lastActiveMs,
    };
  });

  const cronData = cronJobs.map((j) => ({
    id: j.id,
    name: j.name,
    enabled: j.enabled,
    schedule: j.schedule,
    lastRunAtMs: j.lastRunAtMs,
    lastRunStatus: j.lastRunStatus,
    nextRunAtMs: j.nextRunAtMs,
    consecutiveErrors: j.consecutiveErrors,
    lastDurationMs: j.lastDurationMs,
    model: j.model,
  }));

  return NextResponse.json(
    { agents: agentData, cronJobs: cronData },
    { headers: { "Cache-Control": "no-store" } }
  );
}
