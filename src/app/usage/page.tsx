import { fetchSessionUsage } from "@/lib/gateway";
import { UsageClient } from "./usage-client";

export const dynamic = "force-dynamic";

const WINDOW_MINUTES: Record<string, number> = {
  today: 1440,
  week: 10080,
  month: 43200,
  // "all" = no --active flag = undefined
};

interface Props {
  searchParams: Promise<{ window?: string }>;
}

export default async function UsagePage({ searchParams }: Props) {
  const params = await searchParams;
  const window = params.window ?? "today";
  const activeMinutes = WINDOW_MINUTES[window]; // undefined = all
  const data = fetchSessionUsage(activeMinutes);
  return <UsageClient data={data} activeWindow={window} />;
}
