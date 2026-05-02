# ⚡ Olympus Mission Control

A cyberpunk-themed localhost dashboard for managing an AI agent crew built on [OpenClaw](https://github.com/nichochar/openclaw). Think hacker's personal command center — playful, technical, dense with information but never cluttered.

![Dashboard](https://img.shields.io/badge/status-active-22c55e?style=flat-square) ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

## What it does

Mission Control gives you a single pane of glass into everything your AI agent crew is doing:

- **🎯 Tasks** — Kanban board with create/update/delete. Reads and writes `tasks.json` in your OpenClaw workspace.
- **📅 Calendar** — Unified view of cron jobs (from OpenClaw) + real calendar events (via ICS feeds).
- **🚀 Projects** — Project cards with progress bars, linked tasks, and external links.
- **🧠 Memory** — Browse daily logs, long-term memory (MEMORY.md), and companion files (IDENTITY, SOUL, USER, AGENTS, TOOLS).
- **📄 Docs** — Index of every document the agent has produced, searchable with a split-pane viewer.
- **🔍 Search** — Full-text search across all memory, documents, and companion files.

All data comes from the filesystem — no database, no sync layer. The dashboard reads the same files your OpenClaw agent reads and writes.

## Design

- **Pure dark mode** — near-black void background with cyberpunk color accents
- **Agent color system** — each agent in the crew has a fixed color identity (Helios = amber, Zeus = purple, etc.)
- **Inter + JetBrains Mono** typography
- **Extensible agent roster** — add agents via `src/lib/agents.config.ts`, no UI refactor needed

## Quick start

```bash
# Clone and install
git clone https://github.com/joshluedeman/helios-mission-control.git
cd helios-mission-control
npm install

# Run (binds to 0.0.0.0 for LAN access)
npm run dev
```

Open `http://localhost:3000` (or your machine's LAN IP).

On first run, the app auto-creates `tasks.json` and `projects.json` in your OpenClaw workspace (`~/.openclaw/workspace/`) with demo data if they don't already exist.

## Prerequisites

- **Node.js 20+**
- **OpenClaw** installed with a workspace at `~/.openclaw/workspace/`
- **Python 3** with `icalendar`, `recurring-ical-events`, `pytz` (for calendar ICS parsing)

## Project structure

```
src/
├── app/                        # Pages + API routes
│   ├── page.tsx                # Dashboard home
│   ├── tasks/                  # Tasks kanban (CRUD)
│   ├── calendar/               # Calendar + cron viewer
│   ├── projects/               # Project cards
│   ├── memory/                 # Memory browser
│   ├── docs/                   # Document index
│   ├── search/                 # Global search
│   └── api/                    # REST endpoints
│       ├── tasks/route.ts      # Task CRUD → tasks.json
│       ├── calendar/route.ts   # ICS calendar query
│       └── search/route.ts     # Full-text search
├── components/layout/          # Nav shell
└── lib/
    ├── agents.config.ts        # Agent roster (extensible)
    ├── data/
    │   ├── workspace.ts        # Filesystem readers
    │   └── seed.ts             # Auto-seed demo data
    ├── paths.ts                # OpenClaw path constants
    └── format.ts               # Formatters
```

## Data model

The dashboard is a **view** over OpenClaw workspace files — not a separate database:

| Screen | Data source |
|--------|-------------|
| Tasks | `~/.openclaw/workspace/tasks.json` |
| Calendar (cron) | `~/.openclaw/cron/jobs.json` + `jobs-state.json` |
| Calendar (events) | ICS feeds via `skills/ics-calendar/scripts/cal-query.py` |
| Projects | `~/.openclaw/workspace/projects.json` |
| Memory | `~/.openclaw/workspace/memory/*.md` + `MEMORY.md` |
| Docs | `~/.openclaw/workspace/docs/`, `articles/`, `content/` |

## Agent crew (planned)

The system is designed for a multi-agent crew named after Greek gods. Currently only Helios is active:

| Agent | Role | Color | Status |
|-------|------|-------|--------|
| ⚡ Zeus | Chief of Staff | Purple | Planned |
| ☀️ Helios | Personal Ops | Amber | **Active** |
| 🦉 Athena | Strategy | Teal | Planned |
| 🏃 Hermes | Comms | Green | Planned |
| 🔨 Hephaestus | Engineering | Red | Planned |
| 🎵 Apollo | Content | Gold | Planned |
| 🌾 Demeter | Home & Family | Forest | Planned |

## License

MIT
