import { NextRequest, NextResponse } from "next/server";
import { readMemoryStats } from "@/lib/data/workspace";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || undefined;
  const stats = readMemoryStats(date);
  if (!stats) {
    return NextResponse.json({ error: "No stats found for date" }, { status: 404 });
  }
  return NextResponse.json(stats);
}
