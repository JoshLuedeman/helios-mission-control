import { NextResponse } from "next/server";
import fs from "fs";
import { CRON_JOBS } from "@/lib/paths";

// PATCH /api/cron — toggle a cron job enabled/disabled
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, enabled } = body;

    if (!id || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "id and enabled (boolean) are required" }, { status: 400 });
    }

    if (!fs.existsSync(CRON_JOBS)) {
      return NextResponse.json({ error: "Cron jobs file not found" }, { status: 404 });
    }

    const data = JSON.parse(fs.readFileSync(CRON_JOBS, "utf-8"));
    const job = (data.jobs || []).find((j: { id: string }) => j.id === id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    job.enabled = enabled;
    fs.writeFileSync(CRON_JOBS, JSON.stringify(data, null, 2) + "\n", "utf-8");

    return NextResponse.json({ ok: true, id, enabled, name: job.name });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
