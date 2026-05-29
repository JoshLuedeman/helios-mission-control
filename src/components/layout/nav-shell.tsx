"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";
import { ChatWidget } from "../chat/chat-widget";

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
  { href: "/publishing", label: "Publishing", emoji: "📢", shortcut: "0" },
  { href: "/chat", label: "Chat", emoji: "💬", shortcut: "c" },
];

function OnlineDot() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-online opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-online" />
    </span>
  );
}

function NavContent({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, []);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-4 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={item.label}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 text-lg",
                isActive
                  ? "bg-zeus-purple/20 ring-1 ring-zeus-purple/50"
                  : "text-muted-foreground hover:bg-elevated hover:text-foreground"
              )}
            >
              {item.emoji}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* Mission Control Header */}
      <div className="border-b border-border-dim p-4">
        <Link href="/" className="block" onClick={onNavigate}>
          <div className="rounded-lg border border-zeus-purple/30 bg-zeus-purple/5 px-3 py-2.5 text-center transition-all hover:bg-zeus-purple/10 hover:border-zeus-purple/50">
            <div className="font-mono text-[10px] font-bold tracking-[0.25em] text-zeus-purple/70">
              OLYMPUS
            </div>
            <div className="font-mono text-sm font-bold tracking-widest text-zeus-purple">
              MISSION CONTROL
            </div>
          </div>
        </Link>
        <div className="mt-3 flex items-center gap-2 rounded-md bg-surface/50 px-3 py-1.5">
          <OnlineDot />
          <span className="font-mono text-xs font-medium tracking-wider text-helios-amber">
            HELIOS ONLINE
          </span>
          <span className="ml-auto text-lg">☀️</span>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex flex-1 flex-col gap-1 p-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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
    </>
  );
}

export function NavShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Persist sidebar state
  useEffect(() => {
    const stored = localStorage.getItem('olympus-sidebar-collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(v => {
      localStorage.setItem('olympus-sidebar-collapsed', String(!v));
      return !v;
    });
  };

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Auto-refresh server data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
        "c": "/chat",
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
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <nav className={cn(
        "hidden md:flex flex-col border-r border-border-dim bg-[#0d0d14] shrink-0 transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-14" : "w-60"
      )}>
        {sidebarCollapsed ? (
          <NavContent collapsed />
        ) : (
          <div className="w-60">
            <NavContent />
          </div>
        )}
      </nav>

      {/* Desktop toggle button — always visible */}
      <button
        onClick={() => toggleSidebar()}
        className="hidden md:flex fixed top-3 z-30 items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-elevated transition-all duration-300"
        style={{ left: sidebarCollapsed ? '2.75rem' : '14.25rem' }}
        aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          {sidebarCollapsed
            ? <path d="M3 3l5 5-5 5M8 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M13 3l-5 5 5 5M8 3L3 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
        </svg>
      </button>

      {/* ── Mobile: top bar + slide-out drawer ── */}
      <div className="flex md:hidden fixed top-0 left-0 right-0 z-40 h-12 items-center gap-3 border-b border-border-dim bg-[#0d0d14] px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <Link href="/" className="font-mono text-xs font-bold tracking-widest text-zeus-purple">
          MISSION CONTROL
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <OnlineDot />
          <span className="font-mono text-[10px] text-helios-amber">HELIOS</span>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Drawer */}
          <nav
            className="relative flex w-72 flex-col bg-[#0d0d14] border-r border-border-dim h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-elevated transition-colors z-10"
              aria-label="Close menu"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <NavContent onNavigate={() => setMobileOpen(false)} />
          </nav>
        </div>
      )}

      {/* ── Content area ── */}
      <main className="flex-1 overflow-auto bg-void md:mt-0 mt-12">
        {children}
      </main>

      <CommandPalette />
      <ChatWidget />
    </div>
  );
}
