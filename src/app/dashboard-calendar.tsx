"use client";

import { useState, useEffect } from "react";

interface CalEvent {
  title: string;
  calendar: string;
  allday: boolean;
  start_time: string;
  end_time: string;
  location: string | null;
}

export function DashboardCalendar() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calendar?range=today")
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-xs text-muted-foreground animate-pulse">Loading calendar…</div>;
  }

  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground">No events today</div>;
  }

  return (
    <div className="space-y-1.5">
      {events.slice(0, 8).map((ev, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg bg-void/50 px-3 py-2">
          <div className="font-mono text-xs text-status-scheduled w-24 shrink-0">
            {ev.allday ? "ALL DAY" : `${ev.start_time}`}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{ev.title}</div>
            {ev.location && (
              <div className="text-[10px] text-muted-foreground truncate">📍 {ev.location}</div>
            )}
          </div>
        </div>
      ))}
      {events.length > 8 && (
        <div className="text-[10px] font-mono text-muted-foreground pl-3">
          +{events.length - 8} more events
        </div>
      )}
    </div>
  );
}
