import { NextResponse } from "next/server";
import { fetchSessionUsage } from "@/lib/gateway";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = fetchSessionUsage();
  return NextResponse.json(data);
}
