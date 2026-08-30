import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBoards } from "../context/BoardContext";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import { isOverdue, statusLabels, taskCompletion } from "../utils/tasks";

export default function HomePage() {
  const { user } = useAuth();
  const { board, tasks, activities, onlineUserIds } = useBoards();
  if (!board) return <section className="empty-workspace"><Icon name="board" size={42} /><h2>No project is available</h2><p>Create a board from the Project Board page to start managing work.</p><Link className="button primary" to="/board">Open project board</Link></section>;
  const mine = tasks.filter((task) => task.assignee?.id === user.id && task.status !== "done");
  const dueSoon = [...tasks].filter((task) => task.dueDate && task.status !== "done").sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
  const completed = tasks.filter((task) => task.status === "done").length;
  return <section className="content-section home-page">
    <div className="welcome-banner"><div><span className="eyebrow">Welcome back, {user.displayName.split(" ")[0]}</span><h2>Keep {board.title} moving forward.</h2><p>{board.description}</p><div className="welcome-actions"><Link className="button primary" to="/add-task"><Icon name="plus" size={18} />Add task</Link><Link className="button secondary" to="/board"><Icon name="board" size={18} />Open board</Link></div></div><div className="welcome-progress"><div className="progress-ring large" style={{ "--progress": `${taskCompletion(tasks) * 3.6}deg` }}><span>{taskCompletion(tasks)}%</span></div><small>Average project progress</small></div></div>
    <div className="home-stat-grid"><article><span>Total tasks</span><strong>{tasks.length}</strong><small>{completed} completed</small></article><article><span>Your active tasks</span><strong>{mine.length}</strong><small>Assigned to you</small></article><article><span>Team members</span><strong>{board.members.length}</strong><small>{onlineUserIds.length} online now</small></article><article className={tasks.some(isOverdue) ? "warning" : ""}><span>Overdue</span><strong>{tasks.filter(isOverdue).length}</strong><small>Need attention</small></article></div>
    <div className="home-grid">
      <section className="panel home-panel"><header><div><h3>Your assigned work</h3><p>Tasks requiring your attention</p></div><Link to="/tasks">View tasks</Link></header><div className="home-task-list">{mine.slice(0, 5).map((task) => <article key={task.id}><span className={`status-dot status-${task.status}`} /><div><strong>{task.title}</strong><small>{task.category} · {statusLabels[task.status]}</small></div><div className="mini-progress"><span style={{ width: `${task.progress || 0}%` }} /></div><b>{task.progress || 0}%</b></article>)}{!mine.length && <div className="empty-inline">You have no active assigned tasks.</div>}</div></section>
      <section className="panel home-panel"><header><div><h3>Upcoming deadlines</h3><p>Closest project due dates</p></div><Link to="/reports">Report</Link></header><div className="deadline-list">{dueSoon.map((task) => <article key={task.id} className={isOverdue(task) ? "overdue" : ""}><span>{new Date(task.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}</span><div><strong>{task.title}</strong><small>{task.assignee?.displayName || "Unassigned"}</small></div><b>{task.priority}</b></article>)}{!dueSoon.length && <div className="empty-inline">No upcoming deadlines.</div>}</div></section>
      <section className="panel home-panel team-snapshot"><header><div><h3>Team snapshot</h3><p>Roles and delivery progress</p></div><Link to="/members">All members</Link></header><div>{board.members.slice(0, 6).map((member) => <article key={member.user.id}><Avatar user={member.user} size="small" showStatus online={onlineUserIds.includes(member.user.id)} /><div><strong>{member.user.displayName}</strong><small>{member.user.jobTitle}</small></div><span>{member.user.progress || 0}%</span></article>)}</div></section>
      <section className="panel home-panel recent-snapshot"><header><div><h3>Recent activity</h3><p>Latest shared project changes</p></div><Link to="/notifications">Notifications</Link></header><div>{activities.slice(0, 5).map((item) => <article key={item._id}><span className="live-dot" /><div><strong>{item.actor?.displayName || "Team member"}</strong><small>{item.summary}</small></div></article>)}{!activities.length && <div className="empty-inline">Activity will appear as the team works.</div>}</div></section>
    </div>
  </section>;
}
