import type { AgentSession } from "./gateway";

export interface AgentConfig {
  id: string;
  name: string;
  title: string;
  emoji: string;
  color: string; // Tailwind color token
  colorHex: string;
  active: boolean;
}

export const agents: AgentConfig[] = [
  {
    id: "zeus",
    name: "Zeus",
    title: "Chief of Staff",
    emoji: "⚡",
    color: "zeus-purple",
    colorHex: "#8b5cf6",
    active: true,
  },
  {
    id: "helios",
    name: "Helios",
    title: "Personal Ops",
    emoji: "☀️",
    color: "helios-amber",
    colorHex: "#f59e0b",
    active: true,
  },
  {
    id: "athena",
    name: "Athena",
    title: "Strategy & Architecture",
    emoji: "🦉",
    color: "athena-teal",
    colorHex: "#14b8a6",
    active: true,
  },
  {
    id: "hermes",
    name: "Hermes",
    title: "Comms, Scheduling & Crew Routing",
    emoji: "📬",
    color: "hermes-green",
    colorHex: "#22c55e",
    active: true,
  },
  {
    id: "hephaestus",
    name: "Hephaestus",
    title: "Code & Engineering",
    emoji: "🔧",
    color: "hephaestus-red",
    colorHex: "#ef4444",
    active: true,
  },
  {
    id: "apollo",
    name: "Apollo",
    title: "Content & Teaching",
    emoji: "🎵",
    color: "apollo-gold",
    colorHex: "#eab308",
    active: true,
  },
  {
    id: "demeter",
    name: "Demeter",
    title: "Home & Family",
    emoji: "🌾",
    color: "demeter-forest",
    colorHex: "#16a34a",
    active: true,
  },
  {
    id: "argus",
    name: "Argus",
    title: "Monitoring & Observability",
    emoji: "👁️",
    color: "argus-slate",
    colorHex: "#64748b",
    active: true,
  },
];

export function getAgent(id: string): AgentConfig | undefined {
  return agents.find((a) => a.id === id);
}

export function getActiveAgents(): AgentConfig[] {
  return agents.filter((a) => a.active);
}

/**
 * Compute live agent status from session data.
 * - online:  most recent session updated within last 10 min
 * - idle:    most recent session updated within last 60 min
 * - offline: nothing in last 60 min
 */
export function computeAgentStatus(
  agentId: string,
  sessions: AgentSession[]
): "online" | "idle" | "offline" {
  const now = Date.now();
  const agentSessions = sessions
    .filter((s) => s.agentId === agentId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (agentSessions.length === 0) return "offline";

  const latest = agentSessions[0].updatedAt;
  const diffMin = (now - latest) / 60_000;

  if (diffMin <= 10) return "online";
  if (diffMin <= 60) return "idle";
  return "offline";
}

export const MISSION_STATEMENT =
  "Build an always-on AI crew that ships open source, technical content, and consulting deliverables while running the operational backbone of Josh's career, projects, and home — serving the developers and architects building real cloud systems, and supporting his family's logistics and schedules — so everyone can focus their energy on the important things, not the busy things.";
