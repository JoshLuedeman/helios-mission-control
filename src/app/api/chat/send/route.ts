import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      sessionKey: string;
      message: string;
      idempotencyKey: string;
    };

    const { sessionKey, message, idempotencyKey } = body;
    if (!sessionKey || !message || !idempotencyKey) {
      return NextResponse.json(
        { error: "sessionKey, message, and idempotencyKey are required" },
        { status: 400 }
      );
    }

    const params = JSON.stringify({ sessionKey, message, idempotencyKey });
    const raw = execSync(
      `openclaw gateway call chat.send --json --params '${params}'`,
      { timeout: 10_000, encoding: "utf-8" }
    );
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
