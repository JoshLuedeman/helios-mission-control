"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";

const NAV_ITEMS = [
  { href: "/tasks", label: "Tasks", emoji: "🎯", shortcut: "1" },
  { href: "/calendar", label: "Calendar", emoji: "📅", shortcut: "2" },
  { href: "/projects", label: "Projects", emoji: "🚀", shortcut: "3" },
  { href: "/memory", label: "Memory", emoji: "🧠", shortcut: "4" },
  { href: "/docs", label: "Docs", emoji: "📄", shortcut: "5" },
  { href: "/search", label: "Search", emoji: "🔍", shortcut: "6" },
  { href: "/usage", label: "Usage & Cost", emoji: "💰", shortcut: "7" },
  { href: "/cron", label: "Cron Jobs", emoji: "🕐", shortcut: "8" },
  { href: "/routing", label: "Routing", emoji: "⚡", shortcut: "9" },
];

function OnlineDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-online opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-online" />
    </span>
  );
}

export function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [time, setTime] = useState<string>("");

  // Auto-refresh server data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) return;

      const routes: Record<string, string> = {
        "1": "/tasks",
        "2": "/calendar",
        "3": "/projects",
        "4": "/memory",
        "5": "/docs",
        "6": "/search",
        "0": "/",
      };

      if (routes[e.key] && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        router.push(routes[e.key]);
      }

      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        router.push("/tasks?action=create");
      }

      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        router.push("/search");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [router]);

  return (
    <div className="flex h-full">
      {/* Nav Rail */}
      <nav className="flex w-60 flex-col border-r border-border-dim bg-[#0d0d14] shrink-0">
        {/* Mission Control Header */}
        <div className="border-b border-border-dim p-4">
          <Link href="/" className="block">
            <div className="rounded-lg border border-zeus-purple/30 bg-zeus-purple/5 px-3 py-2.5 text-center transition-all hover:bg-zeus-purple/10 hover:border-zeus-purple/50">
              <div className="font-mono text-[10px] font-bold tracking-[0.25em] text-zeus-purple/70">
                OLYMPUS
              </div>
              <div className="font-mono text-sm font-bold tracking-widest text-zeus-purple">
                MISSION CONTROL
              </div>
            </div>
          </Link>

          {/* Online Status */}
          <div className="mt-3 flex items-center gap-2 rounded-md bg-surface/50 px-3 py-1.5">
            <OnlineDot />
            <span className="font-mono text-xs font-medium tracking-wider text-helios-amber">
              HELIOS ONLINE
            </span>
            <span className="ml-auto text-lg">☀️</span>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "border-l-2 border-zeus-purple bg-zeus-purple/10 text-foreground"
                    : "border-l-2 border-transparent text-muted-foreground hover:bg-elevated hover:text-foreground"
                )}
              >
                <span className="text-base">{item.emoji}</span>
                <span className="flex-1">{item.label}</span>
                <kbd className="rounded border border-border-dim/50 bg-void/50 px-1 py-0.5 font-mono text-[9px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.shortcut}
                </kbd>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border-dim p-3 space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <kbd className="rounded border border-border-dim bg-void px-1 py-0.5 font-mono">⌘K</kbd>
            <span>Command palette</span>
          </div>
          {time && (
            <div className="font-mono text-xs text-muted-foreground text-center">{time}</div>
          )}
          <div className="font-mono text-[10px] text-muted-foreground/50 text-center">
            v0.2.0 · localhost
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-auto bg-void">
        {children}
      </main>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
