import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionKey = searchParams.get("sessionKey") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  if (!sessionKey) {
    return NextResponse.json({ error: "sessionKey required", messages: [] }, { status: 400 });
  }

  try {
    const params = JSON.stringify({ sessionKey, limit });
    const raw = execSync(
      `openclaw gateway call chat.history --json --params '${params}'`,
      { timeout: 10_000, encoding: "utf-8" }
    );
    const parsed = JSON.parse(raw) as {
      messages?: Array<{
        role: string;
        content: string | Array<{ type: string; text?: string; name?: string }>;
        ts?: number;
        model?: string;
      }>;
      sessionId?: string;
      thinkingLevel?: string;
    };

    function extractText(content: string | Array<{ type: string; text?: string; name?: string }>): string {
      if (typeof content === "string") return content;
      if (Array.isArray(content)) {
        return content
          .filter((c) => c.type === "text")
          .map((c) => c.text ?? "")
          .join("");
      }
      return "";
    }

    return NextResponse.json(
      {
        messages: (parsed.messages ?? []).map((m) => ({
          role: m.role,
          content: extractText(m.content),
          ts: m.ts,
          model: m.model,
        })),
        sessionId: parsed.sessionId ?? null,
        thinkingLevel: parsed.thinkingLevel ?? "off",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message, messages: [] }, { status: 500 });
  }
}
