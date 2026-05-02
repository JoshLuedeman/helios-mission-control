"use client";

import { useState, useCallback, useEffect } from "react";
import type { Task, TaskStatus, TaskPriority, Project } from "@/lib/data/workspace";
import { getAgent, agents as allAgents } from "@/lib/agents.config";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

const STATUS_COLUMNS: { key: TaskStatus; label: string; color: string; icon: string }[] = [
  { key: "todo", label: "To Do", color: "border-status-scheduled/30", icon: "○" },
  { key: "in_progress", label: "In Progress", color: "border-helios-amber/30", icon: "◉" },
  { key: "done", label: "Done", color: "border-status-online/30", icon: "✓" },
  { key: "blocked", label: "Blocked", color: "border-destructive/30", icon: "✕" },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: "bg-destructive/10 text-destructive",
  high: "bg-status-watch/10 text-status-watch",
  normal: "bg-zeus-purple/10 text-zeus-purple",
  low: "bg-muted text-muted-foreground",
};

const STATUS_CYCLE: TaskStatus[] = ["todo", "in_progress", "done"];

function TaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const agent = getAgent(task.assignee);
  const [showActions, setShowActions] = useState(false);

  const cycleStatus = () => {
    const currentIdx = STATUS_CYCLE.indexOf(task.status);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    onStatusChange(task.id, nextStatus);
  };

  return (
    <div
      className="group rounded-lg border border-border-dim bg-surface p-3 transition-all hover:border-border-bright hover:bg-elevated"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            onClick={cycleStatus}
            className={`mt-0.5 shrink-0 text-xs transition-colors ${
              task.status === "done"
                ? "text-status-online"
                : task.status === "in_progress"
                ? "text-helios-amber"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title={`Click to cycle status (${task.status})`}
          >
            {task.status === "done" ? "✓" : task.status === "in_progress" ? "◉" : task.status === "blocked" ? "✕" : "○"}
          </button>
          <span className={`text-sm font-medium leading-tight ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${PRIORITY_COLORS[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
          {showActions && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-muted-foreground/50 hover:text-destructive text-xs px-1 transition-colors"
              title="Delete task"
            >
              ×
            </button>
          )}
        </div>
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 ml-5 line-clamp-2">{task.description}</p>
      )}
      <div className="mt-2 ml-5 flex items-center gap-2 flex-wrap">
        {agent && (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono"
            style={{ backgroundColor: agent.colorHex + "15", color: agent.colorHex }}
          >
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

function DraggableTaskCard({
  task,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-30" : ""}
      {...listeners}
      {...attributes}
    >
      <TaskCard task={task} onStatusChange={onStatusChange} onDelete={onDelete} />
    </div>
  );
}

function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-2 min-h-[100px] rounded-lg transition-colors ${isOver ? "bg-zeus-purple/5 ring-1 ring-zeus-purple/20" : ""}`}
    >
      {children}
    </div>
  );
}

function CreateTaskForm({
  projects,
  onSubmit,
  onCancel,
}: {
  projects: Project[];
  onSubmit: (task: { title: string; description: string; priority: TaskPriority; assignee: string; project?: string; tags: string[] }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [assignee, setAssignee] = useState("helios");
  const [project, setProject] = useState("");
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title,
      description,
      priority,
      assignee,
      project: project || undefined,
      tags: tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zeus-purple/30 bg-surface p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-zeus-purple tracking-wider">NEW TASK</span>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground text-xs">
          ✕
        </button>
      </div>
      <input
        type="text"
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border border-border-dim bg-void px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none"
        autoFocus
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="w-full rounded-lg border border-border-dim bg-void px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none resize-none"
      />
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] font-mono text-muted-foreground mb-1 block">PRIORITY</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full rounded border border-border-dim bg-void px-2 py-1.5 text-xs text-foreground"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-mono text-muted-foreground mb-1 block">ASSIGNEE</label>
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full rounded border border-border-dim bg-void px-2 py-1.5 text-xs text-foreground"
          >
            {allAgents.filter((a) => a.active).map((a) => (
              <option key={a.id} value={a.id}>
                {a.emoji} {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-mono text-muted-foreground mb-1 block">PROJECT</label>
          <select
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full rounded border border-border-dim bg-void px-2 py-1.5 text-xs text-foreground"
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <input
        type="text"
        placeholder="Tags (comma-separated)"
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        className="w-full rounded-lg border border-border-dim bg-void px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none font-mono"
      />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-md bg-zeus-purple px-4 py-1.5 text-xs font-medium text-white hover:bg-zeus-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create Task
        </button>
      </div>
    </form>
  );
}

export function TasksClient({ initialTasks, projects }: { initialTasks: Task[]; projects: Project[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Auto-open create form when navigated via command palette
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("action") === "create") {
        setShowCreate(true);
        window.history.replaceState({}, "", "/tasks");
      }
    }
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === id);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, updatedAt: new Date().toISOString(), completedAt: status === "done" ? new Date().toISOString() : undefined }
          : t
      )
    );
    const res = await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      toast.success(`"${task?.title}" → ${status.replace("_", " ")}`);
    } else {
      toast.error("Failed to update task");
    }
  }, [tasks]);

  const handleDelete = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`Deleted "${task?.title}"`);
    } else {
      toast.error("Failed to delete task");
    }
  }, [tasks]);

  const handleCreate = useCallback(
    async (taskData: { title: string; description: string; priority: TaskPriority; assignee: string; project?: string; tags: string[] }) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [...prev, newTask]);
        setShowCreate(false);
        toast.success(`Created "${newTask.title}"`);
      } else {
        toast.error("Failed to create task");
      }
    },
    []
  );

  const filtered = searchQuery
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : tasks;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🎯 Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.length} tasks · {tasks.filter((t) => t.status === "in_progress").length} in progress
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-zeus-purple px-4 py-2 text-sm font-medium text-white hover:bg-zeus-purple/80 transition-colors"
        >
          + New Task
        </button>
      </div>

      {/* Create Task Form */}
      {showCreate && (
        <div className="mb-6">
          <CreateTaskForm projects={projects} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </div>
      )}

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(event: DragStartEvent) => {
          const task = tasks.find((t) => t.id === event.active.id);
          setActiveTask(task || null);
        }}
        onDragEnd={(event: DragEndEvent) => {
          setActiveTask(null);
          const { active, over } = event;
          if (!over) return;
          const taskId = active.id as string;
          const newStatus = over.id as TaskStatus;
          const task = tasks.find((t) => t.id === taskId);
          if (task && task.status !== newStatus) {
            handleStatusChange(taskId, newStatus);
          }
        }}
      >
        <div className="grid grid-cols-4 gap-4">
          {STATUS_COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="space-y-2">
                <div className={`rounded-lg border-t-2 ${col.color} bg-surface/30 px-3 py-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold tracking-wider text-muted-foreground">
                      {col.icon} {col.label.toUpperCase()}
                    </span>
                    <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {colTasks.length}
                    </span>
                  </div>
                </div>
                <DroppableColumn id={col.key}>
                  {colTasks.map((task) => (
                    <DraggableTaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="rounded-lg border border-dashed border-border-dim p-4 text-center text-xs text-muted-foreground">
                      Drop here
                    </div>
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="opacity-90 rotate-2 scale-105">
              <TaskCard task={activeTask} onStatusChange={() => {}} onDelete={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
