"use client";

import { useState } from "react";
import type { Task, TaskStatus, TaskPriority } from "@/lib/data/workspace";
import { getAgent } from "@/lib/agents.config";

const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "todo", label: "To Do", color: "border-status-scheduled/30" },
  { key: "in_progress", label: "In Progress", color: "border-helios-amber/30" },
  { key: "done", label: "Done", color: "border-status-online/30" },
  { key: "blocked", label: "Blocked", color: "border-destructive/30" },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: "bg-destructive/10 text-destructive",
  high: "bg-status-watch/10 text-status-watch",
  normal: "bg-zeus-purple/10 text-zeus-purple",
  low: "bg-muted text-muted-foreground",
};

function TaskCard({ task }: { task: Task }) {
  const agent = getAgent(task.assignee);

  return (
    <div className="rounded-lg border border-border-dim bg-surface p-3 transition-all hover:border-border-bright hover:bg-elevated">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm font-medium leading-tight">{task.title}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority.toUpperCase()}
        </span>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        {agent && (
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono" style={{ backgroundColor: agent.colorHex + "15", color: agent.colorHex }}>
            {agent.emoji} {agent.name}
          </span>
        )}
        {task.project && (
          <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
            {task.project}
          </span>
        )}
        {task.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export function TasksClient({ tasks }: { tasks: Task[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = searchQuery
    ? tasks.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : tasks;

  if (tasks.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">🎯 Tasks</h1>
        </div>
        <div className="rounded-xl border border-dashed border-border-dim bg-surface/50 p-12 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h2 className="text-lg font-semibold mb-2">No tasks yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Create a <code className="font-mono text-zeus-purple bg-zeus-purple/10 px-1.5 py-0.5 rounded">tasks.json</code> file
            in the OpenClaw workspace to start tracking agent work.
          </p>
          <pre className="mx-auto max-w-lg text-left text-xs font-mono bg-void rounded-lg p-4 border border-border-dim text-muted-foreground">
{`// ~/.openclaw/workspace/tasks.json
{
  "tasks": [
    {
      "id": "example-task",
      "title": "My first task",
      "description": "Something for Helios to do",
      "status": "todo",
      "priority": "normal",
      "assignee": "helios",
      "tags": [],
      "createdAt": "${new Date().toISOString()}",
      "updatedAt": "${new Date().toISOString()}"
    }
  ]
}`}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🎯 Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.length} tasks · {tasks.filter((t) => t.status === "in_progress").length} in progress
          </p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border-dim bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none focus:ring-1 focus:ring-zeus-purple font-mono"
        />
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="space-y-2">
              <div className={`rounded-lg border-t-2 ${col.color} bg-surface/30 px-3 py-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold tracking-wider text-muted-foreground">
                    {col.label.toUpperCase()}
                  </span>
                  <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {colTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border-dim p-4 text-center text-xs text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
