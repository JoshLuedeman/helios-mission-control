import { readDailyLogs, readLongTermMemory, readCompanionFiles } from "@/lib/data/workspace";
import { MemoryClient } from "./memory-client";

export const dynamic = "force-dynamic";

export default function MemoryPage() {
  const dailyLogs = readDailyLogs();
  const longTermMemory = readLongTermMemory();
  const companionFiles = readCompanionFiles();

  return (
    <MemoryClient
      dailyLogs={dailyLogs}
      longTermMemory={longTermMemory}
      companionFiles={companionFiles}
    />
  );
}
