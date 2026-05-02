import { NextResponse } from "next/server";
import fs from "fs";
import { PROJECTS_JSON } from "@/lib/paths";
import type { Project, ProjectStatus } from "@/lib/data/workspace";

function readProjectsFile(): { projects: Project[] } {
  if (!fs.existsSync(PROJECTS_JSON)) return { projects: [] };
  return JSON.parse(fs.readFileSync(PROJECTS_JSON, "utf-8"));
}

function writeProjectsFile(data: { projects: Project[] }) {
  fs.writeFileSync(PROJECTS_JSON, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

export async function GET() {
  return NextResponse.json(readProjectsFile());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category, tags, links } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      description: description?.trim() || "",
      status: "planning" as ProjectStatus,
      category: category || "general",
      links: links || {},
      tags: tags || [],
      createdAt: now,
      updatedAt: now,
    };

    const data = readProjectsFile();
    data.projects.push(newProject);
    writeProjectsFile(data);

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const data = readProjectsFile();
    const idx = data.projects.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (updates.status) data.projects[idx].status = updates.status;
    if (updates.name) data.projects[idx].name = updates.name;
    if (updates.description !== undefined) data.projects[idx].description = updates.description;
    if (updates.category) data.projects[idx].category = updates.category;
    if (updates.tags) data.projects[idx].tags = updates.tags;
    if (updates.links) data.projects[idx].links = { ...data.projects[idx].links, ...updates.links };
    data.projects[idx].updatedAt = new Date().toISOString();

    writeProjectsFile(data);

    return NextResponse.json(data.projects[idx]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const data = readProjectsFile();
    const idx = data.projects.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    data.projects.splice(idx, 1);
    writeProjectsFile(data);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
