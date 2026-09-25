import { TasksView } from "@/components/tasks-view";
import { listTaskItems } from "@/lib/task-data";

export default function TasksPage() {
  return <TasksView initialTasks={listTaskItems()} />;
}
