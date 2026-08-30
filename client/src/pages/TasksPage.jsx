import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useBoards } from "../context/BoardContext";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import TaskModal from "../components/TaskModal";
import ConflictDialog from "../components/ConflictDialog";
import { isOverdue, statusLabels } from "../utils/tasks";

export default function TasksPage({ adminMode = false }) {
  const boardState = useBoards();
  const { user } = useAuth();
  const { boards, board, tasks, conflict } = boardState;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [selected, setSelected] = useState(null);
  const membership = board?.members.find((item) => item.user.id === user.id);
  const canEdit = adminMode || user.role === "admin" || membership?.role !== "viewer";
  const categories = [...new Set(tasks.map((task) => task.category || "General"))].sort();
  const filtered = useMemo(() => tasks.filter((task) => {
    const text = `${task.title} ${task.description || ""} ${task.category || ""} ${(task.tags || []).join(" ")} ${task.assignee?.displayName || ""}`.toLowerCase();
    return (!query.trim() || text.includes(query.trim().toLowerCase())) && (status === "all" || task.status === status) && (priority === "all" || task.priority === priority) && (category === "all" || (task.category || "General") === category) && (assignee === "all" || (assignee === "unassigned" ? !task.assignee : task.assignee?.id === assignee));
  }), [tasks, query, status, priority, category, assignee]);
  async function save(input) { const output = await boardState.updateTask(selected, input); setSelected(output); return output; }
  async function remove() { if (selected && window.confirm(`Delete “${selected.title}”?`)) { await boardState.deleteTask(selected); setSelected(null); } }
  return <section className="content-section tasks-page">
    <header className="page-heading"><div><span className="eyebrow">{adminMode ? "Administrator task control" : "Project workload"}</span><h2>{adminMode ? "Manage project tasks" : "Tasks"}</h2><p>Search, filter, inspect, update, reassign, track progress, comment, or delete work items.</p></div><span className="context-chip">{filtered.length} of {tasks.length}</span></header>
    <div className="panel task-control-panel">
      <div className="task-filters"><label className="search-control"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, member, category, or tag…" /></label><select value={board?.id || ""} onChange={(event) => boardState.loadBoard(event.target.value)}>{boards.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="todo">Assigned</option><option value="doing">Ongoing</option><option value="done">Done</option></select><select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="all">All assignees</option><option value="unassigned">Unassigned</option>{board?.members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.displayName}</option>)}</select></div>
      <div className="responsive-table task-table"><table><thead><tr><th>Task</th><th>Assignee</th><th>Status</th><th>Progress</th><th>Priority</th><th>Due date</th><th /></tr></thead><tbody>{filtered.map((task) => <tr key={task.id} className={isOverdue(task) ? "overdue-row" : ""}><td><button className="task-title-button" onClick={() => setSelected(task)}><strong>{task.title}</strong><span>{task.category || "General"}{task.comments?.length ? ` · ${task.comments.length} comments` : ""}</span></button></td><td>{task.assignee ? <div className="table-user compact"><Avatar user={task.assignee} size="small" /><div><strong>{task.assignee.displayName}</strong><span>{task.assignee.jobTitle}</span></div></div> : <span className="muted-cell">Unassigned</span>}</td><td><span className={`table-status status-${task.status}`}>{statusLabels[task.status]}</span></td><td><div className="table-progress"><div><span style={{ width: `${task.progress || 0}%` }} /></div><b>{task.progress || 0}%</b></div></td><td><span className={`priority-badge priority-${task.priority}`}>{task.priority}</span></td><td><span className={isOverdue(task) ? "date-overdue" : ""}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</span></td><td><button className="icon-button subtle" onClick={() => setSelected(task)} aria-label={`Open ${task.title}`}><Icon name="edit" size={17} /></button></td></tr>)}</tbody></table>{!filtered.length && <div className="empty-table"><Icon name="search" /><h3>No matching tasks</h3><p>Change the search or filters to see more work.</p></div>}</div>
    </div>
    <TaskModal open={Boolean(selected)} onClose={() => setSelected(null)} task={selected} initialStatus={selected?.status} board={board} readOnly={!canEdit} onSave={save} onDelete={remove} onComment={(message) => boardState.addComment(selected, message)} />
    <ConflictDialog conflict={conflict} onClose={boardState.clearConflict} onUseLatest={(latest) => { boardState.clearConflict(); setSelected(latest); }} />
  </section>;
}
