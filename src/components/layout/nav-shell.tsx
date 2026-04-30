"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/tasks", label: "Tasks", emoji: "🎯" },
  { href: "/calendar", label: "Calendar", emoji: "📅" },
  { href: "/projects", label: "Projects", emoji: "🚀" },
  { href: "/memory", label: "Memory", emoji: "🧠" },
  { href: "/docs", label: "Docs", emoji: "📄" },
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

  return (
    <div className="flex h-full">
      {/* Nav Rail */}
      <nav className="flex w-60 flex-col border-r border-border-dim bg-[#0d0d14] shrink-0">
        {/* Mission Control Header */}
        <div className="border-b border-border-dim p-4">
          <div className="rounded-lg border border-zeus-purple/30 bg-zeus-purple/5 px-3 py-2.5 text-center">
            <div className="font-mono text-[10px] font-bold tracking-[0.25em] text-zeus-purple/70">
              OLYMPUS
            </div>
            <div className="font-mono text-sm font-bold tracking-widest text-zeus-purple">
              MISSION CONTROL
            </div>
          </div>

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
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border-dim p-3">
          <div className="font-mono text-[10px] text-muted-foreground/50 text-center">
            v0.1.0 · localhost
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-auto bg-void">
        {children}
      </main>
    </div>
  );
}
