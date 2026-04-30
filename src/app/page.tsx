import Link from "next/link";
import { getActiveAgents, MISSION_STATEMENT } from "@/lib/agents.config";
import { readDailyLogs, readCronJobs, readDocs, readTasks, readProjects } from "@/lib/data/workspace";
import { DashboardCalendar } from "./dashboard-calendar";

export const dynamic = "force-dynamic";

export default function Home() {
  const activeAgents = getActiveAgents();
  const logs = readDailyLogs();
  const cronJobs = readCronJobs();
  const docs = readDocs();
  const tasks = readTasks();
  const projects = readProjects();

  const enabledCrons = cronJobs.filter((j) => j.enabled);
  const todayLog = logs[0];
  const activeProjects = projects.filter((p) => p.status === "active");

  // Extract first few headings from today's log as activity
  const recentHeadings = todayLog
    ? todayLog.content
        .split("\n")
        .filter((l) => l.startsWith("## "))
        .map((l) => l.slice(3))
        .slice(0, 5)
    : [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-zeus-purple">⚡</span> Mission Control
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          {MISSION_STATEMENT}
        </p>
      </div>

      {/* Top Row: Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Active Agents */}
        <div className="rounded-xl border border-border-dim bg-surface p-5">
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
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">{agent.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks Summary */}
        <Link
          href="/tasks"
          className="group rounded-xl border border-border-dim bg-surface p-5 transition-all hover:border-zeus-purple/30 hover:bg-elevated"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
            🎯 TASKS
          </div>
          {tasks.length > 0 ? (
            <>
              <div className="flex items-baseline gap-3 mb-2">
                <div className="text-2xl font-bold">{tasks.filter((t) => t.status === "in_progress").length}</div>
                <div className="text-xs text-muted-foreground">in progress</div>
              </div>
              <div className="flex gap-3 text-[10px] font-mono">
                <span className="text-status-scheduled">{tasks.filter((t) => t.status === "todo").length} queued</span>
                <span className="text-status-online">{tasks.filter((t) => t.status === "done").length} done</span>
                {tasks.filter((t) => t.status === "blocked").length > 0 && (
                  <span className="text-destructive">{tasks.filter((t) => t.status === "blocked").length} blocked</span>
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No tasks yet</div>
          )}
        </Link>

        {/* Cron Jobs */}
        <Link
          href="/calendar"
          className="group rounded-xl border border-border-dim bg-surface p-5 transition-all hover:border-status-scheduled/30 hover:bg-elevated"
        >
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3 tracking-wider">
            ⏱ CRON JOBS
          </div>
          <div className="text-2xl font-bold">{enabledCrons.length}</div>
          <div className="flex gap-3 text-[10px] font-mono">
            <span className="text-status-online">{enabledCrons.length} active</span>
            <span className="text-muted-foreground">{cronJobs.length - enabledCrons.length} disabled</span>
          </div>
        </Link>

        {/* Quick Stats */}
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
              <span className="text-muted-foreground">Primary</span>
              <span className="font-mono text-foreground">Mistral 7B</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Projects</span>
              <span className="font-mono text-foreground">{activeProjects.length} active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory</span>
              <span className="font-mono text-foreground">{logs.length} logs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Activity + Calendar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-border-dim bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-muted-foreground tracking-wider">RECENT ACTIVITY</span>
            <Link href="/memory" className="text-[10px] font-mono text-zeus-purple hover:underline">View all →</Link>
          </div>

          {todayLog ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-helios-amber">{todayLog.date}</span>
                <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                  {todayLog.wordCount.toLocaleString()} words
                </span>
              </div>
              {recentHeadings.length > 0 ? (
                <div className="space-y-1.5">
                  {recentHeadings.map((heading, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="text-zeus-purple/50">›</span>
                      <span className="text-foreground/90">{heading}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {todayLog.content.split("\n").filter(Boolean)[0]?.slice(0, 100)}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No activity recorded today</div>
          )}

          {/* In-Progress Tasks */}
          {tasks.filter((t) => t.status === "in_progress").length > 0 && (
            <div className="mt-4 pt-4 border-t border-border-dim/50">
              <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-2">IN FLIGHT</div>
              <div className="space-y-1.5">
                {tasks
                  .filter((t) => t.status === "in_progress")
                  .map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-xs">
                      <span className="text-helios-amber">◉</span>
                      <span className="flex-1 truncate">{t.title}</span>
                      {t.project && (
                        <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-mono text-muted-foreground shrink-0">
                          {t.project}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Calendar */}
        <div className="rounded-xl border border-border-dim bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-muted-foreground tracking-wider">TODAY&apos;S CALENDAR</span>
            <Link href="/calendar" className="text-[10px] font-mono text-zeus-purple hover:underline">View all →</Link>
          </div>
          <DashboardCalendar />
        </div>
      </div>

      {/* Projects Row */}
      <div className="mt-4">
        <div className="rounded-xl border border-border-dim bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-muted-foreground tracking-wider">ACTIVE PROJECTS</span>
            <Link href="/projects" className="text-[10px] font-mono text-zeus-purple hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {activeProjects.slice(0, 8).map((p) => {
              const projectTasks = tasks.filter((t) => t.project === p.id);
              const done = projectTasks.filter((t) => t.status === "done").length;
              const total = projectTasks.length;
              return (
                <Link
                  key={p.id}
                  href="/projects"
                  className="rounded-lg border border-border-dim bg-void/50 p-3 hover:bg-elevated hover:border-border-bright transition-all"
                >
                  <div className="text-sm font-medium mb-1 truncate">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{p.description}</div>
                  {total > 0 && (
                    <div className="mt-2">
                      <div className="h-1 rounded-full bg-elevated overflow-hidden">
                        <div className="h-full rounded-full bg-status-online" style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{done}/{total} tasks</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Docs Row */}
      <div className="mt-4">
        <div className="rounded-xl border border-border-dim bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-muted-foreground tracking-wider">RECENT DOCUMENTS</span>
            <Link href="/docs" className="text-[10px] font-mono text-zeus-purple hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {docs.slice(0, 4).map((doc) => (
              <Link
                key={doc.path}
                href="/docs"
                className="flex items-center gap-3 rounded-lg bg-void/50 px-3 py-2 hover:bg-elevated transition-colors"
              >
                <span className="text-sm flex-1 truncate">{doc.title}</span>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0">{doc.directory}</span>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0">{doc.wordCount} words</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
