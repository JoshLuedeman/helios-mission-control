"use client";

import { useState } from "react";
import type { Project, Task, ProjectStatus } from "@/lib/data/workspace";

const STATUS_COLORS: Record<ProjectStatus, string> = {
  active: "bg-status-online/10 text-status-online",
  paused: "bg-status-watch/10 text-status-watch",
  planning: "bg-zeus-purple/10 text-zeus-purple",
  complete: "bg-muted text-muted-foreground",
};

function ProjectCard({
  project,
  tasks,
  isSelected,
  onClick,
}: {
  project: Project;
  tasks: Task[];
  isSelected: boolean;
  onClick: () => void;
}) {
  const projectTasks = tasks.filter((t) => t.project === project.id);
  const doneTasks = projectTasks.filter((t) => t.status === "done").length;
  const totalTasks = projectTasks.length;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border bg-surface p-5 text-left transition-all hover:bg-elevated ${
        isSelected ? "border-zeus-purple/50" : "border-border-dim hover:border-border-bright"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold">{project.name}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-mono ${STATUS_COLORS[project.status]}`}>
          {project.status.toUpperCase()}
        </span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{project.description}</p>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
            <span>{doneTasks}/{totalTasks} tasks</span>
            <span>{Math.round((doneTasks / totalTasks) * 100)}%</span>
          </div>
          <div className="h-1 rounded-full bg-elevated overflow-hidden">
            <div
              className="h-full rounded-full bg-status-online transition-all"
              style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-elevated px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Links */}
      {(project.links.github || project.links.notion || project.links.brain) && (
        <div className="mt-2 flex gap-2 text-[10px] font-mono text-muted-foreground">
          {project.links.github && <span>🔗 GitHub</span>}
          {project.links.notion && <span>📋 Notion</span>}
          {project.links.brain && <span>🧠 Brain</span>}
        </div>
      )}
    </button>
  );
}

export function ProjectsClient({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "all">("all");

  const filtered = filterStatus === "all"
    ? projects
    : projects.filter((p) => p.status === filterStatus);

  if (projects.length === 0) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">🚀 Projects</h1>
        </div>
        <div className="rounded-xl border border-dashed border-border-dim bg-surface/50 p-12 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-lg font-semibold mb-2">No projects yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            Create a <code className="font-mono text-zeus-purple bg-zeus-purple/10 px-1.5 py-0.5 rounded">projects.json</code> file
            in the OpenClaw workspace to track projects.
          </p>
          <pre className="mx-auto max-w-lg text-left text-xs font-mono bg-void rounded-lg p-4 border border-border-dim text-muted-foreground">
{`// ~/.openclaw/workspace/projects.json
{
  "projects": [
    {
      "id": "scaffold",
      "name": "Scaffold",
      "description": "OSS migration tool",
      "status": "active",
      "category": "oss",
      "links": { "github": "..." },
      "tags": ["engineering"],
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

  const selectedTasks = selectedProject
    ? tasks.filter((t) => t.project === selectedProject.id)
    : [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">🚀 Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {projects.length} projects · {projects.filter((p) => p.status === "active").length} active
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-1 rounded-lg bg-surface p-1 w-fit">
        {(["all", "active", "planning", "paused", "complete"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === f
                ? "bg-zeus-purple/20 text-zeus-purple"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Project List */}
        <div className="w-full max-w-lg space-y-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={tasks}
              isSelected={selectedProject?.id === project.id}
              onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
            />
          ))}
        </div>

        {/* Project Detail */}
        {selectedProject && (
          <div className="flex-1 rounded-xl border border-border-dim bg-surface p-6 sticky top-8 self-start max-h-[calc(100vh-8rem)] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{selectedProject.name}</h2>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{selectedProject.description}</p>

            {/* Related Tasks */}
            <div className="mb-4">
              <div className="text-xs font-mono text-muted-foreground tracking-wider mb-2">RELATED TASKS</div>
              {selectedTasks.length > 0 ? (
                <div className="space-y-1">
                  {selectedTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 rounded-lg bg-void/50 px-3 py-2 text-xs">
                      <span className={`h-2 w-2 rounded-full ${
                        t.status === "done" ? "bg-status-online" :
                        t.status === "in_progress" ? "bg-helios-amber" :
                        t.status === "blocked" ? "bg-destructive" : "bg-status-scheduled"
                      }`} />
                      <span className="flex-1">{t.title}</span>
                      <span className="font-mono text-muted-foreground">{t.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No tasks linked to this project</p>
              )}
            </div>

            {/* Links */}
            {(selectedProject.links.github || selectedProject.links.notion || selectedProject.links.brain) && (
              <div>
                <div className="text-xs font-mono text-muted-foreground tracking-wider mb-2">LINKS</div>
                <div className="space-y-1">
                  {selectedProject.links.github && (
                    <a href={selectedProject.links.github} className="block text-xs text-zeus-purple hover:underline" target="_blank" rel="noopener noreferrer">
                      🔗 {selectedProject.links.github}
                    </a>
                  )}
                  {selectedProject.links.brain && (
                    <div className="text-xs text-muted-foreground">🧠 {selectedProject.links.brain}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
