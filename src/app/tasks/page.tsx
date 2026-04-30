import { readTasks } from "@/lib/data/workspace";
import { TasksClient } from "./tasks-client";

export default function TasksPage() {
  const tasks = readTasks();
  return <TasksClient tasks={tasks} />;
}
