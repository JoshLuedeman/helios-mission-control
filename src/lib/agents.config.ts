export interface AgentConfig {
  id: string;
  name: string;
  title: string;
  emoji: string;
  color: string; // Tailwind color token
  colorHex: string;
  status: "online" | "standby" | "offline";
  active: boolean; // Whether this agent is actually deployed
}

export const agents: AgentConfig[] = [
  {
    id: "zeus",
    name: "Zeus",
    title: "Chief of Staff",
    emoji: "⚡",
    color: "zeus-purple",
    colorHex: "#8b5cf6",
    status: "offline",
    active: false,
  },
  {
    id: "helios",
    name: "Helios",
    title: "Personal Ops",
    emoji: "☀️",
    color: "helios-amber",
    colorHex: "#f59e0b",
    status: "online",
    active: true,
  },
  {
    id: "athena",
    name: "Athena",
    title: "Strategy & Architecture",
    emoji: "🦉",
    color: "athena-teal",
    colorHex: "#14b8a6",
    status: "offline",
    active: false,
  },
  {
    id: "hermes",
    name: "Hermes",
    title: "Comms & Scheduling",
    emoji: "🏃",
    color: "hermes-green",
    colorHex: "#22c55e",
    status: "offline",
    active: false,
  },
  {
    id: "hephaestus",
    name: "Hephaestus",
    title: "Code & Engineering",
    emoji: "🔨",
    color: "hephaestus-red",
    colorHex: "#ef4444",
    status: "offline",
    active: false,
  },
  {
    id: "apollo",
    name: "Apollo",
    title: "Content & Teaching",
    emoji: "🎵",
    color: "apollo-gold",
    colorHex: "#eab308",
    status: "offline",
    active: false,
  },
  {
    id: "demeter",
    name: "Demeter",
    title: "Home & Family",
    emoji: "🌾",
    color: "demeter-forest",
    colorHex: "#16a34a",
    status: "offline",
    active: false,
  },
];

export function getAgent(id: string): AgentConfig | undefined {
  return agents.find((a) => a.id === id);
}

export function getActiveAgents(): AgentConfig[] {
  return agents.filter((a) => a.active);
}

export const MISSION_STATEMENT =
  "Build an always-on AI crew that ships open source, technical content, and consulting deliverables while running the operational backbone of Josh's career, projects, and home — serving the developers and architects building real cloud systems, and supporting his family's logistics and schedules — so everyone can focus their energy on the important things, not the busy things.";
