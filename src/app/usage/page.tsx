import { fetchSessionUsage } from "@/lib/gateway";
import { UsageClient } from "./usage-client";

export const dynamic = "force-dynamic";

export default function UsagePage() {
  const data = fetchSessionUsage();
  return <UsageClient data={data} />;
}
