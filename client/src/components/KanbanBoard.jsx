import TaskCard from "./TaskCard";
import Icon from "./Icon";

export const columns = [
  { id: "todo", label: "Assigned", description: "Ready to begin" },
  { id: "doing", label: "Ongoing", description: "Currently moving" },
  { id: "done", label: "Done", description: "Completed work" }
];

export default function KanbanBoard({ tasks, onOpenTask, onMoveTask, onAddTask, canEdit = true }) {
  function dragStart(event, task) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/pms-task", task.id);
  }
  function drop(event, status) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("application/pms-task");
    const task = tasks.find((item) => item.id === taskId);
    if (canEdit && task && task.status !== status) onMoveTask(task, status);
  }
  return (
    <div className="kanban-board" aria-label="Task board">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.id).sort((a, b) => a.position - b.position);
        return (
          <section className={`kanban-column column-${column.id}`} key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => drop(event, column.id)}>
            <header className="column-header">
              <div><span className="column-dot" /><div><h2>{column.label}<small>{columnTasks.length}</small></h2><p>{column.description}</p></div></div>
              {canEdit && <button className="icon-button subtle" onClick={() => onAddTask(column.id)} aria-label={`Add task to ${column.label}`}><Icon name="plus" size={18} /></button>}
            </header>
            <div className="column-tasks">
              {columnTasks.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpenTask} onDragStart={dragStart} canEdit={canEdit} />)}
              {columnTasks.length === 0 && (canEdit ? <button className="empty-column" onClick={() => onAddTask(column.id)}><Icon name="plus" />Drop a task here or add one</button> : <div className="empty-column">No tasks in this column</div>)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
