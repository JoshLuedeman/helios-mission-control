import path from "path";

const HOME = process.env.HOME || "/Users/helios";

export const OPENCLAW_ROOT = path.join(HOME, ".openclaw");
export const WORKSPACE = path.join(OPENCLAW_ROOT, "workspace");
export const CRON_DIR = path.join(OPENCLAW_ROOT, "cron");

// Workspace files
export const MEMORY_MD = path.join(WORKSPACE, "MEMORY.md");
export const IDENTITY_MD = path.join(WORKSPACE, "IDENTITY.md");
export const SOUL_MD = path.join(WORKSPACE, "SOUL.md");
export const USER_MD = path.join(WORKSPACE, "USER.md");
export const AGENTS_MD = path.join(WORKSPACE, "AGENTS.md");
export const TOOLS_MD = path.join(WORKSPACE, "TOOLS.md");
export const PLAN_MD = path.join(WORKSPACE, "PLAN.md");
export const HEARTBEAT_MD = path.join(WORKSPACE, "HEARTBEAT.md");

// Directories
export const MEMORY_DIR = path.join(WORKSPACE, "memory");
export const DOCS_DIR = path.join(WORKSPACE, "docs");
export const ARTICLES_DIR = path.join(WORKSPACE, "articles");
export const CONTENT_DIR = path.join(WORKSPACE, "content");
export const SKILLS_DIR = path.join(WORKSPACE, "skills");
export const SCRIPTS_DIR = path.join(WORKSPACE, "scripts");
export const STATE_DIR = path.join(WORKSPACE, "state");

// Cron
export const CRON_JOBS = path.join(CRON_DIR, "jobs.json");
export const CRON_STATE = path.join(CRON_DIR, "jobs-state.json");
export const CRON_RUNS = path.join(CRON_DIR, "runs");

// OpenClaw config
export const OPENCLAW_CONFIG = path.join(OPENCLAW_ROOT, "openclaw.json");

// Tasks & Projects (new files we create)
export const TASKS_JSON = path.join(WORKSPACE, "tasks.json");
export const PROJECTS_JSON = path.join(WORKSPACE, "projects.json");

// Zeus & routing logs
export const ZEUS_LOG = path.join(WORKSPACE, "workspaces/zeus/memory/zeus-log.md");
export const CREW_ROUTING_LOG = path.join(OPENCLAW_ROOT, "logs/crew-routing.log");

// Obsidian brain (read-only)
export const BRAIN_ROOT = "/Volumes/batcave/brain";
export const BRAIN_PROJECTS = path.join(BRAIN_ROOT, "30-PROJECTS");
