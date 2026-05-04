import { NextResponse } from "next/server";
import { fetchCronRuns } from "@/lib/gateway";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId") ?? undefined;
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const data = fetchCronRuns(jobId, limit, offset);
  return NextResponse.json(data);
}
