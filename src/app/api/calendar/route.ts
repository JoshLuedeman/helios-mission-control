import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";

const CAL_QUERY_SCRIPT = path.join(
  process.env.HOME || "/Users/helios",
  ".openclaw/workspace/skills/ics-calendar/scripts/cal-query.py"
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "today";

  try {
    const output = execSync(`python3 "${CAL_QUERY_SCRIPT}" ${range} --json`, {
      encoding: "utf-8",
      timeout: 15000,
    });

    const data = JSON.parse(output);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to query calendar", details: message, events: [] },
      { status: 500 }
    );
  }
}
