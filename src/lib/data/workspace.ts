import fs from "fs";
import path from "path";
import * as paths from "../paths";

// ─── Memory ───────────────────────────────────────────────

export interface DailyLog {
  date: string; // YYYY-MM-DD
  filename: string;
  content: string;
  wordCount: number;
}

export interface CompanionFile {
  name: string;
  filename: string;
  content: string;
  wordCount: number;
}

export function readDailyLogs(): DailyLog[] {
  if (!fs.existsSync(paths.MEMORY_DIR)) return [];
  const files = fs.readdirSync(paths.MEMORY_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.md$/.test(f));
  return files
    .map((f) => {
      const content = fs.readFileSync(path.join(paths.MEMORY_DIR, f), "utf-8");
      return {
        date: f.replace(".md", ""),
        filename: f,
        content,
        wordCount: content.split(/\s+/).length,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function readLongTermMemory(): string {
  if (!fs.existsSync(paths.MEMORY_MD)) return "";
  return fs.readFileSync(paths.MEMORY_MD, "utf-8");
}

const COMPANION_FILES = [
  { name: "Identity", path: paths.IDENTITY_MD },
  { name: "Soul", path: paths.SOUL_MD },
  { name: "User", path: paths.USER_MD },
  { name: "Agents", path: paths.AGENTS_MD },
  { name: "Tools", path: paths.TOOLS_MD },
  { name: "Plan", path: paths.PLAN_MD },
];

export function readCompanionFiles(): CompanionFile[] {
  return COMPANION_FILES.filter((f) => fs.existsSync(f.path)).map((f) => {
    const content = fs.readFileSync(f.path, "utf-8");
    return {
      name: f.name,
      filename: path.basename(f.path),
      content,
      wordCount: content.split(/\s+/).length,
    };
  });
}

// ─── Cron Jobs ────────────────────────────────────────────

export interface CronJob {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule: {
    kind: string;
    expr: string;
    tz: string;
  };
  agentId: string;
  model?: string;
  state?: {
    lastRunAtMs?: number;
    lastRunStatus?: string;
    nextRunAtMs?: number;
    consecutiveErrors?: number;
    lastDurationMs?: number;
  };
}

export function readCronJobs(): CronJob[] {
  if (!fs.existsSync(paths.CRON_JOBS)) return [];
  const jobsData = JSON.parse(fs.readFileSync(paths.CRON_JOBS, "utf-8"));

  let stateData: Record<string, { state: CronJob["state"] }> = {};
  if (fs.existsSync(paths.CRON_STATE)) {
    const raw = JSON.parse(fs.readFileSync(paths.CRON_STATE, "utf-8"));
    stateData = raw.jobs || {};
  }

  return (jobsData.jobs || []).map((job: Record<string, unknown>) => ({
    id: job.id as string,
    name: job.name as string,
    description: job.description as string,
    enabled: job.enabled as boolean,
    schedule: job.schedule as CronJob["schedule"],
    agentId: job.agentId as string,
    model: (job.payload as Record<string, unknown>)?.model as string | undefined,
    state: stateData[job.id as string]?.state,
  }));
}

// ─── Documents ────────────────────────────────────────────

export interface DocFile {
  title: string;
  path: string;       // relative to workspace
  absolutePath: string;
  directory: string;   // docs, articles, content, or root
  content: string;
  wordCount: number;
  modifiedAt: Date;
  sizeBytes: number;
}

function scanDir(dir: string, dirLabel: string): DocFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(md|txt)$/i.test(f))
    .map((f) => {
      const abs = path.join(dir, f);
      const stat = fs.statSync(abs);
      const content = fs.readFileSync(abs, "utf-8");
      const titleMatch = content.match(/^#\s+(.+)$/m);
      return {
        title: titleMatch ? titleMatch[1] : f.replace(/\.(md|txt)$/, ""),
        path: path.relative(paths.WORKSPACE, abs),
        absolutePath: abs,
        directory: dirLabel,
        content,
        wordCount: content.split(/\s+/).length,
        modifiedAt: stat.mtime,
        sizeBytes: stat.size,
      };
    });
}

export function readDocs(): DocFile[] {
  const docs = [
    ...scanDir(paths.DOCS_DIR, "docs"),
    ...scanDir(paths.ARTICLES_DIR, "articles"),
    ...scanDir(paths.CONTENT_DIR, "content"),
  ];

  // Also include any .md files in workspace root that aren't companion files
  const companionNames = new Set([
    "MEMORY.md", "IDENTITY.md", "SOUL.md", "USER.md",
    "AGENTS.md", "TOOLS.md", "PLAN.md", "HEARTBEAT.md",
  ]);
  const rootMds = fs
    .readdirSync(paths.WORKSPACE)
    .filter((f) => /\.md$/i.test(f) && !companionNames.has(f));
  for (const f of rootMds) {
    const abs = path.join(paths.WORKSPACE, f);
    const stat = fs.statSync(abs);
    const content = fs.readFileSync(abs, "utf-8");
    const titleMatch = content.match(/^#\s+(.+)$/m);
    docs.push({
      title: titleMatch ? titleMatch[1] : f.replace(/\.md$/, ""),
      path: f,
      absolutePath: abs,
      directory: "workspace",
      content,
      wordCount: content.split(/\s+/).length,
      modifiedAt: stat.mtime,
      sizeBytes: stat.size,
    });
  }

  return docs.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
}

// ─── Brain (Obsidian) ─────────────────────────────────────

export interface BrainFile {
  title: string;
  path: string;       // relative to brain root
  absolutePath: string;
  folder: string;     // top-level brain folder (00-CORE, 10-LIBRARIES, etc.)
  content: string;
  wordCount: number;
  modifiedAt: Date;
  sizeBytes: number;
}

function scanBrainDir(dir: string, folder: string, maxDepth: number = 3, currentDepth: number = 0): BrainFile[] {
  if (currentDepth > maxDepth) return [];
  if (!fs.existsSync(dir)) return [];

  const results: BrainFile[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name.startsWith("@") || entry.name === "node_modules") continue;

      const abs = path.join(dir, entry.name);
      if (entry.isFile() && /\.md$/i.test(entry.name)) {
        try {
          const stat = fs.statSync(abs);
          // Skip very large files (>100KB)
          if (stat.size > 100 * 1024) continue;
          const content = fs.readFileSync(abs, "utf-8");
          const titleMatch = content.match(/^#\s+(.+)$/m);
          results.push({
            title: titleMatch ? titleMatch[1] : entry.name.replace(/\.md$/, ""),
            path: path.relative(paths.BRAIN_ROOT, abs),
            absolutePath: abs,
            folder,
            content,
            wordCount: content.split(/\s+/).length,
            modifiedAt: stat.mtime,
            sizeBytes: stat.size,
          });
        } catch {
          // Skip unreadable files
        }
      } else if (entry.isDirectory()) {
        results.push(...scanBrainDir(abs, folder, maxDepth, currentDepth + 1));
      }
    }
  } catch {
    // Brain might not be mounted
  }

  return results;
}

const BRAIN_FOLDERS = [
  "00-CORE",
  "05-INBOX",
  "10-LIBRARIES",
  "20-CONTEXTS",
  "30-PROJECTS",
  "90-WORKBENCH",
  "95-SOURCES",
];

export function readBrainFiles(): BrainFile[] {
  if (!fs.existsSync(paths.BRAIN_ROOT)) return [];

  const files: BrainFile[] = [];
  for (const folder of BRAIN_FOLDERS) {
    const dir = path.join(paths.BRAIN_ROOT, folder);
    files.push(...scanBrainDir(dir, folder));
  }

  return files.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
}

export function isBrainMounted(): boolean {
  return fs.existsSync(paths.BRAIN_ROOT);
}

export interface FolderNode {
  name: string;
  path: string; // relative to brain root
  children: FolderNode[];
  fileCount: number;
}

export function readBrainTree(): FolderNode[] {
  if (!fs.existsSync(paths.BRAIN_ROOT)) return [];

  function buildTree(dir: string, maxDepth: number = 3, depth: number = 0): FolderNode[] {
    if (depth > maxDepth) return [];
    if (!fs.existsSync(dir)) return [];

    const nodes: FolderNode[] = [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name.startsWith("@") || entry.name === "node_modules") continue;
        if (!entry.isDirectory()) continue;

        const abs = path.join(dir, entry.name);
        const relPath = path.relative(paths.BRAIN_ROOT, abs);
        const children = buildTree(abs, maxDepth, depth + 1);

        // Count .md files in this directory (non-recursive)
        let fileCount = 0;
        try {
          fileCount = fs.readdirSync(abs).filter((f) => /\.md$/i.test(f) && !f.startsWith(".")).length;
        } catch { /* skip */ }

        nodes.push({
          name: entry.name,
          path: relPath,
          children,
          fileCount,
        });
      }
    } catch { /* skip */ }

    return nodes.sort((a, b) => a.name.localeCompare(b.name));
  }

  return buildTree(paths.BRAIN_ROOT);
}

export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TaskPriority = "urgent" | "high" | "normal" | "low";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string; // agent id
  project?: string; // project id
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate?: string;
}

export function readTasks(): Task[] {
  if (!fs.existsSync(paths.TASKS_JSON)) return [];
  const data = JSON.parse(fs.readFileSync(paths.TASKS_JSON, "utf-8"));
  return data.tasks || [];
}

// ─── Projects ─────────────────────────────────────────────

export type ProjectStatus = "active" | "paused" | "planning" | "complete";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  category: string;
  links: {
    github?: string;
    notion?: string;
    brain?: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export function readProjects(): Project[] {
  if (!fs.existsSync(paths.PROJECTS_JSON)) return [];
  const data = JSON.parse(fs.readFileSync(paths.PROJECTS_JSON, "utf-8"));
  return data.projects || [];
}

// ─── Search ───────────────────────────────────────────────

export interface SearchResult {
  source: string; // e.g. "memory/2026-04-28.md"
  type: "memory" | "doc" | "companion";
  title: string;
  snippet: string;
  lineNumber: number;
}

export function searchFiles(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  // Search daily logs
  for (const log of readDailyLogs()) {
    const lines = log.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        results.push({
          source: `memory/${log.filename}`,
          type: "memory",
          title: `Daily Log — ${log.date}`,
          snippet: lines.slice(Math.max(0, i - 1), i + 2).join("\n"),
          lineNumber: i + 1,
        });
      }
    }
  }

  // Search docs
  for (const doc of readDocs()) {
    const lines = doc.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        results.push({
          source: doc.path,
          type: "doc",
          title: doc.title,
          snippet: lines.slice(Math.max(0, i - 1), i + 2).join("\n"),
          lineNumber: i + 1,
        });
      }
    }
  }

  // Search companion files
  for (const cf of readCompanionFiles()) {
    const lines = cf.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(lowerQuery)) {
        results.push({
          source: cf.filename,
          type: "companion",
          title: cf.name,
          snippet: lines.slice(Math.max(0, i - 1), i + 2).join("\n"),
          lineNumber: i + 1,
        });
      }
    }
  }

  return results;
}
