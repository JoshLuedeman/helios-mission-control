import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = execSync("openclaw gateway call agents.list --json", {
      timeout: 10_000,
      encoding: "utf-8",
    });
    const parsed = JSON.parse(raw) as {
      agents?: Array<{
        id: string;
        workspace?: string;
        model?: { primary?: string };
      }>;
    };
    const agents = (parsed.agents ?? []).map((a) => ({
      id: a.id,
      label: a.id,
      model: a.model?.primary ?? null,
    }));
    return NextResponse.json({ agents }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, agents: [] }, { status: 500 });
  }
}
