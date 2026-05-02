"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";

const PAGES = [
  { name: "Dashboard", href: "/", emoji: "⚡", keywords: "home overview status" },
  { name: "Tasks", href: "/tasks", emoji: "🎯", keywords: "kanban board todo" },
  { name: "Calendar", href: "/calendar", emoji: "📅", keywords: "cron schedule events" },
  { name: "Projects", href: "/projects", emoji: "🚀", keywords: "project tracker" },
  { name: "Memory", href: "/memory", emoji: "🧠", keywords: "logs journal daily" },
  { name: "Docs", href: "/docs", emoji: "📄", keywords: "documents articles content" },
  { name: "Search", href: "/search", emoji: "🔍", keywords: "find grep" },
];

const ACTIONS = [
  { name: "New Task", href: "/tasks?action=create", emoji: "➕", keywords: "add create task" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="absolute left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2">
        <Command
          className="rounded-xl border border-border-dim bg-surface shadow-2xl overflow-hidden"
          loop
        >
          <div className="flex items-center border-b border-border-dim px-4">
            <span className="text-muted-foreground mr-2">⚡</span>
            <Command.Input
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
            <kbd className="rounded border border-border-dim bg-void px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group
              heading={
                <span className="px-2 text-[10px] font-mono text-muted-foreground tracking-wider">
                  PAGES
                </span>
              }
            >
              {PAGES.map((page) => (
                <Command.Item
                  key={page.href}
                  value={`${page.name} ${page.keywords}`}
                  onSelect={() => navigate(page.href)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-zeus-purple/10 data-[selected=true]:text-foreground text-muted-foreground"
                >
                  <span className="text-base">{page.emoji}</span>
                  <span>{page.name}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-border-dim" />

            <Command.Group
              heading={
                <span className="px-2 text-[10px] font-mono text-muted-foreground tracking-wider">
                  ACTIONS
                </span>
              }
            >
              {ACTIONS.map((action) => (
                <Command.Item
                  key={action.href}
                  value={`${action.name} ${action.keywords}`}
                  onSelect={() => navigate(action.href)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors data-[selected=true]:bg-zeus-purple/10 data-[selected=true]:text-foreground text-muted-foreground"
                >
                  <span className="text-base">{action.emoji}</span>
                  <span>{action.name}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="border-t border-border-dim px-4 py-2 flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>esc close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
