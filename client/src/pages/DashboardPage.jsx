import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useBoards } from "../context/BoardContext";
import Icon from "../components/Icon";
import { isOverdue, statusLabels, taskCompletion } from "../utils/tasks";

function Bar({ label, value, total, color }) {
  const percent = total ? Math.round(value / total * 100) : 0;
  return <div className="chart-bar-row"><div><span>{label}</span><b>{value}</b></div><div className="chart-track"><span style={{ width: `${percent}%`, background: color }} /></div><small>{percent}%</small></div>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { board, tasks } = useBoards();
  const stats = useMemo(() => ({ assigned: tasks.filter((task) => task.status === "todo").length, ongoing: tasks.filter((task) => task.status === "doing").length, done: tasks.filter((task) => task.status === "done").length, overdue: tasks.filter(isOverdue).length }), [tasks]);
  const priorities = ["urgent", "high", "medium", "low"].map((priority) => ({ priority, count: tasks.filter((task) => task.priority === priority).length }));
  const categories = [...new Set(tasks.map((task) => task.category || "General"))].map((category) => ({ category, count: tasks.filter((task) => (task.category || "General") === category).length })).sort((a, b) => b.count - a.count);
  const mine = tasks.filter((task) => task.assignee?.id === user.id);
  return <section className="content-section dashboard-page">
    <header className="page-heading"><div><span className="eyebrow">Project intelligence</span><h2>{board?.title || "Project"} dashboard</h2><p>Live workload, status, progress, priority, and delivery indicators calculated from the shared task data.</p></div><span className="context-chip">Updated live</span></header>
    <div className="dashboard-metrics"><article><span className="metric-icon purple"><Icon name="tasks" /></span><div><small>Total tasks</small><strong>{tasks.length}</strong><span>Across the project</span></div></article><article><span className="metric-icon blue"><Icon name="activity" /></span><div><small>Ongoing</small><strong>{stats.ongoing}</strong><span>Currently in progress</span></div></article><article><span className="metric-icon green"><Icon name="check" /></span><div><small>Completed</small><strong>{stats.done}</strong><span>{tasks.length ? Math.round(stats.done / tasks.length * 100) : 0}% completion rate</span></div></article><article className={stats.overdue ? "warning" : ""}><span className="metric-icon orange"><Icon name="calendar" /></span><div><small>Overdue</small><strong>{stats.overdue}</strong><span>Require follow-up</span></div></article></div>
    <div className="dashboard-grid">
      <section className="panel dashboard-card"><header><div><h3>Workflow status</h3><p>Tasks by current stage</p></div><strong>{taskCompletion(tasks)}% avg.</strong></header><div className="donut-layout"><div className="dashboard-donut" style={{ "--done": `${tasks.length ? stats.done / tasks.length * 360 : 0}deg`, "--doing": `${tasks.length ? (stats.done + stats.ongoing) / tasks.length * 360 : 0}deg` }}><span>{tasks.length}</span><small>tasks</small></div><div className="donut-legend"><span><i className="assigned" />{statusLabels.todo}<b>{stats.assigned}</b></span><span><i className="ongoing" />{statusLabels.doing}<b>{stats.ongoing}</b></span><span><i className="done" />{statusLabels.done}<b>{stats.done}</b></span></div></div></section>
      <section className="panel dashboard-card"><header><div><h3>Priority distribution</h3><p>Where attention is concentrated</p></div></header><div className="chart-bars">{priorities.map((item) => <Bar key={item.priority} label={item.priority} value={item.count} total={tasks.length} color={{ urgent: "#a00", high: "#e35b38", medium: "#ffba00", low: "#2ea2cc" }[item.priority]} />)}</div></section>
      <section className="panel dashboard-card"><header><div><h3>Category workload</h3><p>Work grouped by discipline</p></div></header><div className="chart-bars">{categories.slice(0, 6).map((item, index) => <Bar key={item.category} label={item.category} value={item.count} total={tasks.length} color={["#720eec", "#2ea2cc", "#7ad03a", "#ffba00", "#a00", "#958e09"][index]} />)}</div></section>
      <section className="panel dashboard-card"><header><div><h3>Your task progress</h3><p>Personal workload summary</p></div><strong>{taskCompletion(mine)}%</strong></header><div className="personal-progress-list">{mine.slice(0, 6).map((task) => <article key={task.id}><div><strong>{task.title}</strong><span>{statusLabels[task.status]} · {task.priority}</span></div><div className="chart-track"><span style={{ width: `${task.progress || 0}%` }} /></div><b>{task.progress || 0}%</b></article>)}{!mine.length && <div className="empty-inline">No tasks are assigned to you.</div>}</div></section>
    </div>
  </section>;
}
