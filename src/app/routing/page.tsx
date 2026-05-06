import { readZeusLog, readRoutingLog } from "@/lib/data/workspace";

export const dynamic = "force-dynamic";

export default function RoutingPage() {
  const zeusEntries = readZeusLog();
  const routingLines = readRoutingLog();

  const totalLines = zeusEntries.reduce((s, e) => s + e.lines, 0);
  const totalWarnings = zeusEntries.reduce((s, e) => s + e.warnings, 0);
  const totalAlerts = zeusEntries.reduce((s, e) => s + e.alertsNew, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-zeus-purple">⚡</span> Routing Decisions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Zeus Z2 sync timeline — routing log analysis and alert feed.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-border-dim bg-surface p-4">
          <div className="text-xs font-mono text-muted-foreground tracking-wider mb-1">SYNC RUNS</div>
          <div className="text-2xl font-bold">{zeusEntries.length}</div>
        </div>
        <div className="rounded-xl border border-border-dim bg-surface p-4">
          <div className="text-xs font-mono text-muted-foreground tracking-wider mb-1">LINES PROCESSED</div>
          <div className="text-2xl font-bold">{totalLines.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-border-dim bg-surface p-4">
          <div className="text-xs font-mono text-muted-foreground tracking-wider mb-1">TOTAL WARNINGS</div>
          <div className="text-2xl font-bold text-helios-amber">{totalWarnings}</div>
        </div>
        <div className="rounded-xl border border-border-dim bg-surface p-4">
          <div className="text-xs font-mono text-muted-foreground tracking-wider mb-1">ALERTS RAISED</div>
          <div className="text-2xl font-bold text-destructive">{totalAlerts}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 rounded-xl border border-border-dim bg-surface p-5">
          <div className="text-xs font-mono text-muted-foreground tracking-wider mb-4">Z2 SYNC TIMELINE</div>
          {zeusEntries.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">No Zeus log entries yet.</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {zeusEntries.map((entry, i) => (
                <div
                  key={i}
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    entry.alertsNew > 0
                      ? "border-destructive/30 bg-destructive/5"
                      : entry.warnings > 0
                      ? "border-helios-amber/30 bg-helios-amber/5"
                      : "border-border-dim bg-elevated/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{entry.timestamp}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                      entry.mode === "first-run"
                        ? "bg-zeus-purple/20 text-zeus-purple"
                        : "bg-elevated text-muted-foreground"
                    }`}>
                      {entry.mode}
                    </span>
                  </div>
                  <div className="mt-1.5 flex gap-3 flex-wrap text-[11px] font-mono">
                    <span className="text-foreground/80">{entry.lines} lines</span>
                    {entry.warnings > 0 && (
                      <span className="text-helios-amber">⚠ {entry.warnings} warnings</span>
                    )}
                    {entry.candidates > 0 && (
                      <span className="text-zeus-purple">◆ {entry.candidates} candidates</span>
                    )}
                    {entry.alertsNew > 0 && (
                      <span className="text-destructive">🔔 {entry.alertsNew} alerts{entry.alertsEmailed > 0 ? ` (${entry.alertsEmailed} emailed)` : ""}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Routing Log */}
        <div className="rounded-xl border border-border-dim bg-surface p-5">
          <div className="text-xs font-mono text-muted-foreground tracking-wider mb-4">
            CREW-ROUTING.LOG
            <span className="ml-2 text-[10px] text-muted-foreground/50">({routingLines.length} lines)</span>
          </div>
          {routingLines.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No routing log yet.
              <br />
              <span className="text-[10px] font-mono mt-1 block opacity-50">crew-routing.log will appear here when populated.</span>
            </div>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto font-mono text-[10px] text-muted-foreground">
              {routingLines.slice(-100).map((line, i) => (
                <div key={i} className="truncate hover:whitespace-normal hover:break-all">{line}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
