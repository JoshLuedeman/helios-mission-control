import { readTasks } from "@/lib/data/workspace";
import { readProjects } from "@/lib/data/workspace";
import { TasksClient } from "./tasks-client";

export const dynamic = "force-dynamic";

export default function TasksPage() {
  const tasks = readTasks();
  const projects = readProjects();
  return <TasksClient initialTasks={tasks} projects={projects} />;
}
