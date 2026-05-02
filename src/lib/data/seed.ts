import fs from "fs";
import * as paths from "../paths";

const DEMO_TASKS = {
  tasks: [
    {
      id: "demo-setup-dashboard",
      title: "Configure Mission Control dashboard",
      description: "Set up the Olympus Mission Control dashboard with real workspace data",
      status: "in_progress",
      priority: "high",
      assignee: "helios",
      project: "mission-control",
      tags: ["infrastructure", "dashboard"],
      createdAt: "2026-04-30T15:00:00Z",
      updatedAt: "2026-04-30T19:00:00Z",
    },
    {
      id: "demo-content-pipeline",
      title: "Draft first newsletter article",
      description: "Write and publish a Substack article, then promote on LinkedIn and X",
      status: "todo",
      priority: "normal",
      assignee: "helios",
      project: "content",
      tags: ["content", "substack"],
      createdAt: "2026-04-29T12:00:00Z",
      updatedAt: "2026-04-29T12:00:00Z",
    },
    {
      id: "demo-email-check",
      title: "Re-enable email polling cron",
      description: "Fix cadence mismatch and re-enable the email inbox check cron job",
      status: "blocked",
      priority: "normal",
      assignee: "helios",
      tags: ["email", "cron"],
      createdAt: "2026-04-28T16:00:00Z",
      updatedAt: "2026-04-29T12:00:00Z",
    },
    {
      id: "demo-family-routing",
      title: "Verify family group chat routing",
      description: "Confirm inbound group traffic creates a family-group session correctly",
      status: "todo",
      priority: "high",
      assignee: "helios",
      project: "family-agents",
      tags: ["imessage", "routing"],
      createdAt: "2026-04-29T12:00:00Z",
      updatedAt: "2026-04-29T12:00:00Z",
    },
    {
      id: "demo-scaffold-review",
      title: "Review Scaffold BAK restore extension design",
      description: "Evaluate SQL Server BAK → Azure SQL Database extension via IBackupRestoreEngine",
      status: "done",
      priority: "normal",
      assignee: "helios",
      project: "scaffold",
      tags: ["engineering", "oss"],
      createdAt: "2026-04-27T12:00:00Z",
      updatedAt: "2026-04-28T18:00:00Z",
      completedAt: "2026-04-28T18:00:00Z",
    },
  ],
};

const DEMO_PROJECTS = {
  projects: [
    {
      id: "mission-control",
      name: "Olympus Mission Control",
      description:
        "Localhost Next.js dashboard — command center for the AI crew. Real-time view of tasks, calendar, memory, and docs.",
      status: "active",
      category: "infrastructure",
      links: {
        github: "https://github.com/example/olympus-mission-control",
      },
      tags: ["dashboard", "next.js", "infrastructure"],
      createdAt: "2026-04-30T15:00:00Z",
      updatedAt: "2026-04-30T19:00:00Z",
    },
    {
      id: "scaffold",
      name: "Scaffold",
      description:
        "OSS migration tool — modular engine for database migrations with assessment, progress tracking, and a React frontend.",
      status: "active",
      category: "oss",
      links: {
        github: "https://github.com/example/scaffold",
      },
      tags: ["engineering", "oss", "azure"],
      createdAt: "2026-04-27T12:00:00Z",
      updatedAt: "2026-04-30T12:00:00Z",
    },
    {
      id: "content",
      name: "Content Pipeline",
      description:
        "Article → social media content pipeline. Substack for full articles, LinkedIn for summaries, X for promotion.",
      status: "active",
      category: "content",
      links: {},
      tags: ["content", "social", "brand"],
      createdAt: "2026-04-28T12:00:00Z",
      updatedAt: "2026-04-29T18:00:00Z",
    },
    {
      id: "family-agents",
      name: "Family Agents",
      description:
        "Family DM and group chat agents accessible via iMessage. Separate workspaces with privacy boundaries.",
      status: "active",
      category: "infrastructure",
      links: {},
      tags: ["agents", "imessage", "family"],
      createdAt: "2026-04-28T12:00:00Z",
      updatedAt: "2026-04-29T22:00:00Z",
    },
    {
      id: "homestead",
      name: "The Farm Hand",
      description:
        "Product suite for farmers and homesteaders — automation, dashboards, offline AI, IoT sensors.",
      status: "planning",
      category: "product",
      links: {},
      tags: ["iot", "product", "agriculture"],
      createdAt: "2026-04-27T12:00:00Z",
      updatedAt: "2026-04-27T12:00:00Z",
    },
  ],
};

/**
 * Ensures tasks.json and projects.json exist in the OpenClaw workspace.
 * If they don't exist, seeds them with demo data so the dashboard
 * has something to show on first run.
 */
export function ensureWorkspaceFiles() {
  if (!fs.existsSync(paths.TASKS_JSON)) {
    try {
      fs.writeFileSync(
        paths.TASKS_JSON,
        JSON.stringify(DEMO_TASKS, null, 2) + "\n",
        "utf-8"
      );
      console.log("[olympus] Created tasks.json with demo data");
    } catch (err) {
      console.warn("[olympus] Could not create tasks.json:", err);
    }
  }

  if (!fs.existsSync(paths.PROJECTS_JSON)) {
    try {
      fs.writeFileSync(
        paths.PROJECTS_JSON,
        JSON.stringify(DEMO_PROJECTS, null, 2) + "\n",
        "utf-8"
      );
      console.log("[olympus] Created projects.json with demo data");
    } catch (err) {
      console.warn("[olympus] Could not create projects.json:", err);
    }
  }
}
