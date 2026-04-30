import { readProjects } from "@/lib/data/workspace";
import { readTasks } from "@/lib/data/workspace";
import { ProjectsClient } from "./projects-client";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  const projects = readProjects();
  const tasks = readTasks();
  return <ProjectsClient projects={projects} tasks={tasks} />;
}
