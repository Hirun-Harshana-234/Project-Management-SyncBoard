export const statusLabels = { todo: "Assigned", doing: "Ongoing", done: "Done" };
export const categories = ["General", "Planning", "Design", "Frontend", "Backend", "Testing", "DevOps", "Documentation"];

export function isOverdue(task) {
  return Boolean(task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0)));
}

export function taskCompletion(tasks) {
  if (!tasks.length) return 0;
  return Math.round(tasks.reduce((sum, task) => sum + Number(task.progress || 0), 0) / tasks.length);
}
