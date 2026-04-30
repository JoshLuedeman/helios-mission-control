import { readCronJobs } from "@/lib/data/workspace";
import { CalendarClient } from "./calendar-client";

export const dynamic = "force-dynamic";

export default function CalendarPage() {
  const cronJobs = readCronJobs();
  return <CalendarClient cronJobs={cronJobs} />;
}
