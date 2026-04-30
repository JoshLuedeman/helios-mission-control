import { NextResponse } from "next/server";
import fs from "fs";
import { TASKS_JSON } from "@/lib/paths";
import type { Task, TaskStatus, TaskPriority } from "@/lib/data/workspace";

function readTasksFile(): { tasks: Task[] } {
  if (!fs.existsSync(TASKS_JSON)) return { tasks: [] };
  return JSON.parse(fs.readFileSync(TASKS_JSON, "utf-8"));
}

function writeTasksFile(data: { tasks: Task[] }) {
  fs.writeFileSync(TASKS_JSON, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// GET /api/tasks — return all tasks
export async function GET() {
  const data = readTasksFile();
  return NextResponse.json(data);
}

// POST /api/tasks — create a new task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, priority, assignee, project, tags } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      description: description?.trim() || "",
      status: "todo" as TaskStatus,
      priority: (priority || "normal") as TaskPriority,
      assignee: assignee || "helios",
      project: project || undefined,
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    };

    const data = readTasksFile();
    data.tasks.push(newTask);
    writeTasksFile(data);

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/tasks — update a task (status, etc.)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const data = readTasksFile();
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    if (updates.status) data.tasks[idx].status = updates.status;
    if (updates.title) data.tasks[idx].title = updates.title;
    if (updates.description !== undefined) data.tasks[idx].description = updates.description;
    if (updates.priority) data.tasks[idx].priority = updates.priority;
    if (updates.assignee) data.tasks[idx].assignee = updates.assignee;
    if (updates.project !== undefined) data.tasks[idx].project = updates.project;
    if (updates.tags) data.tasks[idx].tags = updates.tags;
    data.tasks[idx].updatedAt = now;

    if (updates.status === "done" && !data.tasks[idx].completedAt) {
      data.tasks[idx].completedAt = now;
    }
    if (updates.status && updates.status !== "done") {
      data.tasks[idx].completedAt = undefined;
    }

    writeTasksFile(data);

    return NextResponse.json(data.tasks[idx]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/tasks — delete a task
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const data = readTasksFile();
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    data.tasks.splice(idx, 1);
    writeTasksFile(data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
