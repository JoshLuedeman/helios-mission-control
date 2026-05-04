import { fetchCronJobs, fetchCronRuns } from "@/lib/gateway";
import { CronClient } from "./cron-client";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ job?: string }>;
}

export default async function CronPage({ searchParams }: Props) {
  const params = await searchParams;
  const jobs = fetchCronJobs();
  // Always fetch recent runs across all jobs for the list view
  const recentRuns = fetchCronRuns(undefined, 100);
  // If a job is selected, fetch its full run history for drill-down
  const drillRuns = params.job ? fetchCronRuns(params.job, 50) : null;

  return (
    <CronClient
      jobs={jobs}
      recentRuns={recentRuns}
      drillRuns={drillRuns}
      selectedJobId={params.job ?? null}
    />
  );
}
