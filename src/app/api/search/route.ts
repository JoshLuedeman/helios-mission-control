import { NextResponse } from "next/server";
import { searchFiles } from "@/lib/data/workspace";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q.trim()) {
    return NextResponse.json({ results: [], query: "" });
  }

  const results = searchFiles(q);
  // Deduplicate: keep first match per source file
  const seen = new Set<string>();
  const deduped = results.filter((r) => {
    const key = `${r.source}:${r.lineNumber}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ results: deduped.slice(0, 50), query: q });
}
