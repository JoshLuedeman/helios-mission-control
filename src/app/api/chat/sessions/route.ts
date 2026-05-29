import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? "";

  try {
    const params = JSON.stringify(agentId ? { agentId } : {});
    const raw = execSync(
      `openclaw gateway call sessions.list --json --params '${params}'`,
      { timeout: 10_000, encoding: "utf-8" }
    );
    const parsed = JSON.parse(raw) as {
      sessions?: Array<{
        key: string;
        kind?: string;
        displayName?: string;
        chatType?: string;
        updatedAt?: number;
        status?: string;
        model?: string;
        totalTokens?: number;
      }>;
    };
    const sessions = (parsed.sessions ?? []).map((s) => ({
      key: s.key,
      kind: s.kind ?? "direct",
      displayName: s.displayName ?? s.key,
      chatType: s.chatType ?? "direct",
      updatedAt: s.updatedAt ?? 0,
      status: s.status ?? "done",
      model: s.model ?? null,
      totalTokens: s.totalTokens ?? 0,
    }));
    return NextResponse.json({ sessions }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, sessions: [] }, { status: 500 });
  }
}
