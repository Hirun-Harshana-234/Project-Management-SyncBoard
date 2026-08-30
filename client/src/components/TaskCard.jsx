import Avatar from "./Avatar";
import Icon from "./Icon";

function formatDueDate(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export default function TaskCard({ task, onOpen, onDragStart, canEdit = true }) {
  const overdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));
  return (
    <article
      className={`task-card priority-${task.priority} ${String(task.id).startsWith("offline-") ? "offline-task" : ""}`}
      draggable={canEdit && !String(task.id).startsWith("offline-")}
      onDragStart={(event) => onDragStart(event, task)}
      onClick={() => onOpen(task)}
      tabIndex="0"
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(task); }}
    >
      <div className="task-card-top"><span className="priority-badge">{task.priority}</span>{String(task.id).startsWith("offline-") && <span className="local-badge">Waiting to sync</span>}</div>
      <h3>{task.title}</h3>
      {task.description && <p>{task.description}</p>}
      <div className="task-category-progress"><span>{task.category || "General"}</span><div><i style={{ width: `${task.progress || 0}%` }} /></div><b>{task.progress || 0}%</b></div>
      {task.tags?.length > 0 && <div className="task-tags">{task.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>}
      <footer>
        <div className={`task-meta ${overdue ? "overdue" : ""}`}>
          {task.dueDate && <span><Icon name="calendar" size={15} />{formatDueDate(task.dueDate)}</span>}
          {task.comments?.length > 0 && <span><Icon name="comment" size={15} />{task.comments.length}</span>}
        </div>
        {task.assignee ? <Avatar user={task.assignee} size="small" /> : <span className="unassigned" title="Unassigned">?</span>}
      </footer>
    </article>
  );
}
