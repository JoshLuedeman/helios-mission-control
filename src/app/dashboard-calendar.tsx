"use client";

import { useState, useEffect, useRef } from "react";

interface CalEvent {
  title: string;
  calendar: string;
  allday: boolean;
  start_time: string;
  end_time: string;
  location: string | null;
}

function parseTime(timeStr: string): Date | null {
  // timeStr like "9:00 AM" or "14:30"
  if (!timeStr || timeStr === "ALL DAY") return null;
  const now = new Date();
  const m12 = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (m12) {
    let h = parseInt(m12[1]);
    const min = parseInt(m12[2]);
    const ampm = m12[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min);
  }
  const m24 = timeStr.match(/^(\d+):(\d+)$/);
  if (m24) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(m24[1]), parseInt(m24[2]));
  }
  return null;
}

function isCurrentEvent(ev: CalEvent): boolean {
  if (ev.allday) return false;
  const now = new Date();
  const start = parseTime(ev.start_time);
  const end = parseTime(ev.end_time);
  if (!start) return false;
  if (!end) return now >= start;
  return now >= start && now <= end;
}

function isUpcoming(ev: CalEvent): boolean {
  if (ev.allday) return false;
  const now = new Date();
  const start = parseTime(ev.start_time);
  if (!start) return false;
  const diffMin = (start.getTime() - now.getTime()) / 60000;
  return diffMin > 0 && diffMin <= 30;
}

export function DashboardCalendar() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/calendar?range=today")
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  // Auto-scroll current event to center
  useEffect(() => {
    if (!currentRef.current || !scrollRef.current) return;
    const container = scrollRef.current;
    const el = currentRef.current;
    const top = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [events]);

  if (loading) {
    return <div className="text-xs text-muted-foreground animate-pulse">Loading calendar…</div>;
  }

  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground">No events today</div>;
  }

  const allDay = events.filter((e) => e.allday);
  const timed = events.filter((e) => !e.allday);

  return (
    <div className="flex flex-col gap-2">
      {/* All-day events */}
      {allDay.map((ev, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg bg-zeus-purple/5 border border-zeus-purple/20 px-3 py-1.5">
          <div className="font-mono text-[10px] text-zeus-purple w-20 shrink-0">ALL DAY</div>
          <div className="text-xs truncate">{ev.title}</div>
        </div>
      ))}

      {/* Timed events — scrollable, fixed height */}
      <div ref={scrollRef} className="overflow-y-auto max-h-64 space-y-1 pr-1" style={{ scrollbarWidth: "thin" }}>
        {timed.map((ev, i) => {
          const current = isCurrentEvent(ev);
          const upcoming = !current && isUpcoming(ev);
          return (
            <div
              key={i}
              ref={current ? currentRef : undefined}
              className={`flex items-start gap-3 rounded-lg px-3 py-2 transition-colors ${
                current
                  ? "bg-status-online/10 border border-status-online/30"
                  : upcoming
                  ? "bg-helios-amber/5 border border-helios-amber/20"
                  : "bg-void/50"
              }`}
            >
              <div className="font-mono text-xs shrink-0 w-20 pt-0.5" style={{
                color: current ? "rgb(var(--status-online))" : upcoming ? "#f59e0b" : undefined
              }}>
                {ev.start_time}
                {current && <div className="text-[8px] font-bold tracking-wider opacity-70">NOW</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${current ? "font-semibold" : ""}`}>{ev.title}</div>
                {ev.end_time && (
                  <div className="text-[10px] text-muted-foreground">until {ev.end_time}</div>
                )}
                {ev.location && (
                  <div className="text-[10px] text-muted-foreground truncate">📍 {ev.location}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
