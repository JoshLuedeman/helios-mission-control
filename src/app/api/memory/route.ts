import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { MEMORY_DIR } from "@/lib/paths";

// POST /api/memory — append a note to today's daily log
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { note } = body;

    if (!note?.trim()) {
      return NextResponse.json({ error: "Note is required" }, { status: 400 });
    }

    // Ensure memory directory exists
    if (!fs.existsSync(MEMORY_DIR)) {
      fs.mkdirSync(MEMORY_DIR, { recursive: true });
    }

    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const timeStr = today.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    });
    const filePath = path.join(MEMORY_DIR, `${dateStr}.md`);

    const entry = `\n\n## Quick Note — ${timeStr}\n\n${note.trim()}\n`;

    if (fs.existsSync(filePath)) {
      // Append to existing daily log
      fs.appendFileSync(filePath, entry, "utf-8");
    } else {
      // Create new daily log
      const header = `# Daily Memory — ${today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "America/New_York",
      })}\n${entry}`;
      fs.writeFileSync(filePath, header, "utf-8");
    }

    return NextResponse.json({
      ok: true,
      file: `memory/${dateStr}.md`,
      time: timeStr,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
