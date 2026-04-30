import Link from "next/link";
import { getActiveAgents, MISSION_STATEMENT } from "@/lib/agents.config";
import { readDailyLogs, readCronJobs, readDocs, readTasks } from "@/lib/data/workspace";

export default function Home() {
  const activeAgents = getActiveAgents();
  const logs = readDailyLogs();
  const cronJobs = readCronJobs();
  const docs = readDocs();
  const tasks = readTasks();

  const enabledCrons = cronJobs.filter((j) => j.enabled);
  const todayLog = logs[0];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-zeus-purple">⚡</span> Mission Control
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          {MISSION_STATEMENT}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Active Agents */}
        <Link
          href="/tasks"
          className="group rounded-xl border border-border-dim bg-surface p-5 transition-all hover:border-helios-amber/30 hover:bg-elevated"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
            CREW STATUS
          </div>
          <div className="space-y-2">
            {activeAgents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: agent.colorHex }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: agent.colorHex }} />
                </span>
                <span className="text-sm font-medium">{agent.emoji} {agent.name}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{agent.title}</span>
              </div>
            ))}
          </div>
        </Link>

        {/* Tasks Summary */}
        <Link
          href="/tasks"
          className="group rounded-xl border border-border-dim bg-surface p-5 transition-all hover:border-zeus-purple/30 hover:bg-elevated"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
            🎯 TASKS
          </div>
          {tasks.length > 0 ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "in_progress").length}</div>
              <div className="text-xs text-muted-foreground">in progress · {tasks.filter((t) => t.status === "todo").length} queued</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No tasks yet — add tasks.json to workspace</div>
          )}
        </Link>

        {/* Cron Jobs */}
        <Link
          href="/calendar"
          className="group rounded-xl border border-border-dim bg-surface p-5 transition-all hover:border-status-scheduled/30 hover:bg-elevated"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
            📅 CRON JOBS
          </div>
          <div className="text-2xl font-bold">{enabledCrons.length}</div>
          <div className="text-xs text-muted-foreground">
            active · {cronJobs.length - enabledCrons.length} disabled
          </div>
        </Link>

        {/* Memory */}
        <Link
          href="/memory"
          className="group rounded-xl border border-border-dim bg-surface p-5 transition-all hover:border-helios-amber/30 hover:bg-elevated"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
            🧠 MEMORY
          </div>
          <div className="text-2xl font-bold">{logs.length}</div>
          <div className="text-xs text-muted-foreground">
            daily logs {todayLog && `· latest: ${todayLog.date}`}
          </div>
        </Link>

        {/* Docs */}
        <Link
          href="/docs"
          className="group rounded-xl border border-border-dim bg-surface p-5 transition-all hover:border-status-oneshot/30 hover:bg-elevated"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
            📄 DOCUMENTS
          </div>
          <div className="text-2xl font-bold">{docs.length}</div>
          <div className="text-xs text-muted-foreground">
            artifacts across {new Set(docs.map((d) => d.directory)).size} directories
          </div>
        </Link>

        {/* Quick Stats */}
        <div className="rounded-xl border border-border-dim bg-surface p-5">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
            ⚙️ SYSTEM
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Runtime</span>
              <span className="font-mono">OpenClaw</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Primary Model</span>
              <span className="font-mono">Mistral 7B</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agents</span>
              <span className="font-mono">{activeAgents.length} active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
