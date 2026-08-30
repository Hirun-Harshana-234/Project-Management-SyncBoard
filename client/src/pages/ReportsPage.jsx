import { useMemo } from "react";
import { useBoards } from "../context/BoardContext";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import { isOverdue, statusLabels, taskCompletion } from "../utils/tasks";

function csvCell(value) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

export default function ReportsPage({ adminMode = false }) {
  const { boards, board, tasks, loadBoard } = useBoards();
  const members = useMemo(() => (board?.members || []).map((member) => {
    const assigned = tasks.filter((task) => task.assignee?.id === member.user.id);
    return { ...member, assigned: assigned.length, completed: assigned.filter((task) => task.status === "done").length, progress: taskCompletion(assigned) };
  }), [board, tasks]);
  const summary = { total: tasks.length, assigned: tasks.filter((task) => task.status === "todo").length, ongoing: tasks.filter((task) => task.status === "doing").length, done: tasks.filter((task) => task.status === "done").length, overdue: tasks.filter(isOverdue).length, progress: taskCompletion(tasks) };
  function exportCsv() {
    const columns = ["Task title", "Description", "Assigned member", "Status", "Progress", "Priority", "Category", "Due date", "Comments", "Created", "Updated"];
    const rows = tasks.map((task) => [task.title, task.description, task.assignee?.displayName || "Unassigned", statusLabels[task.status], `${task.progress || 0}%`, task.priority, task.category || "General", task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "", task.comments?.length || 0, task.createdAt, task.updatedAt]);
    const content = [columns, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `PMS-${(board?.title || "project").replace(/[^a-z0-9]+/gi, "-")}-report.csv`; anchor.click(); URL.revokeObjectURL(url);
  }
  return <section className="content-section reports-page">
    <header className="page-heading"><div><span className="eyebrow">{adminMode ? "Administration reporting" : "Project reporting"}</span><h2>Reports</h2><p>Review delivery health, team contribution, deadlines, and detailed task records, then export the current report to CSV.</p></div><button className="button primary" onClick={exportCsv}><Icon name="download" size={18} />Export CSV</button></header>
    <div className="report-toolbar"><label>Project<select value={board?.id || ""} onChange={(event) => loadBoard(event.target.value)}>{boards.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><span>Report generated {new Date().toLocaleString()}</span></div>
    <div className="report-summary"><article><span>Project progress</span><strong>{summary.progress}%</strong><div><i style={{ width: `${summary.progress}%` }} /></div></article><article><span>Assigned</span><strong>{summary.assigned}</strong><small>Awaiting or started</small></article><article><span>Ongoing</span><strong>{summary.ongoing}</strong><small>Active work</small></article><article><span>Done</span><strong>{summary.done}</strong><small>Completed work</small></article><article className={summary.overdue ? "warning" : ""}><span>Overdue</span><strong>{summary.overdue}</strong><small>Past due date</small></article></div>
    <div className="reports-grid"><section className="panel report-panel"><header><div><h3>Member performance</h3><p>Assigned workload and average task progress</p></div></header><div className="member-report-list">{members.map((member) => <article key={member.user.id}><Avatar user={member.user} size="small" /><div><strong>{member.user.displayName}</strong><span>{member.user.jobTitle} · {member.assigned} tasks · {member.completed} done</span><div className="chart-track"><i style={{ width: `${member.progress}%` }} /></div></div><b>{member.progress}%</b></article>)}</div></section><section className="panel report-panel"><header><div><h3>Status summary</h3><p>Current task pipeline</p></div></header><div className="report-status-list">{Object.entries(statusLabels).map(([key, label]) => { const count = tasks.filter((task) => task.status === key).length; return <article key={key}><span className={`status-dot status-${key}`} /><strong>{label}</strong><div><i style={{ width: `${tasks.length ? count / tasks.length * 100 : 0}%` }} /></div><b>{count}</b></article>; })}</div></section></div>
    <section className="panel detailed-report"><div className="panel-heading"><div><h3>Detailed task report</h3><p>Complete task information for the selected project</p></div><span>{tasks.length} records</span></div><div className="responsive-table"><table><thead><tr><th>Task</th><th>Member</th><th>Status</th><th>Progress</th><th>Priority</th><th>Category</th><th>Due</th></tr></thead><tbody>{tasks.map((task) => <tr key={task.id}><td><strong>{task.title}</strong></td><td>{task.assignee?.displayName || "Unassigned"}</td><td>{statusLabels[task.status]}</td><td>{task.progress || 0}%</td><td className="capitalize">{task.priority}</td><td>{task.category || "General"}</td><td className={isOverdue(task) ? "date-overdue" : ""}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</td></tr>)}</tbody></table></div></section>
  </section>;
}
