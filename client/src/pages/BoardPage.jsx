import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBoards } from "../context/BoardContext";
import { useAuth } from "../context/AuthContext";
import KanbanBoard from "../components/KanbanBoard";
import TaskModal from "../components/TaskModal";
import BoardModal from "../components/BoardModal";
import ConflictDialog from "../components/ConflictDialog";
import ActivityList from "../components/ActivityList";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";

export default function BoardPage() {
  const boardState = useBoards();
  const { user } = useAuth();
  const { boards, board, tasks, activities, onlineUserIds, loading, notice, conflict } = boardState;
  const [taskModal, setTaskModal] = useState({ open: false, task: null, status: "todo" });
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query) || task.category?.toLowerCase().includes(query) || task.tags?.some((tag) => tag.toLowerCase().includes(query));
    return matchesSearch && (priority === "all" || task.priority === priority);
  }), [tasks, search, priority]);

  const counts = { total: tasks.length, doing: tasks.filter((task) => task.status === "doing").length, done: tasks.filter((task) => task.status === "done").length, overdue: tasks.filter((task) => task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date()).length };
  const completion = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
  const membership = board?.members.find((member) => member.user.id === user.id);
  const canEdit = user.role === "admin" || membership?.role !== "viewer";

  if (loading && !board) return <div className="board-skeleton"><div /><div /><div /></div>;
  if (!board) return <section className="empty-workspace"><span className="empty-visual"><Icon name="board" size={42} /></span><h2>Create your first team board</h2><p>Bring tasks, teammates, comments, and live updates into one shared workspace.</p><button className="button primary" onClick={() => setBoardModalOpen(true)}><Icon name="plus" />Create board</button><BoardModal open={boardModalOpen} onClose={() => setBoardModalOpen(false)} onCreate={boardState.createBoard} /></section>;

  function openTask(task) { setTaskModal({ open: true, task, status: task?.status || "todo" }); }
  function closeTask() { setTaskModal({ open: false, task: null, status: "todo" }); }
  async function saveTask(input) { return taskModal.task ? boardState.updateTask(taskModal.task, input) : boardState.createTask(input); }
  async function removeTask() { if (taskModal.task && window.confirm(`Delete “${taskModal.task.title}”?`)) { await boardState.deleteTask(taskModal.task); closeTask(); } }

  return <>
    <section className="board-toolbar">
      <div className="board-select-wrap"><span className="board-color" style={{ background: board.color }} /><select value={board.id} onChange={(event) => boardState.loadBoard(event.target.value)} aria-label="Select board">{boards.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><button className="icon-button bordered" onClick={() => setBoardModalOpen(true)} aria-label="Create another board"><Icon name="plus" /></button></div>
      <div className="board-people">{board.members.slice(0, 4).map((member) => <Avatar key={member.user.id} user={member.user} size="small" showStatus online={onlineUserIds.includes(member.user.id)} />)}<span>{onlineUserIds.length} online</span></div>
      {canEdit && <button className="button primary" onClick={() => setTaskModal({ open: true, task: null, status: "todo" })}><Icon name="plus" size={18} />New task</button>}
    </section>
    {notice && <div className="system-notice"><Icon name={boardState.isOffline ? "wifiOff" : "check"} size={17} />{notice}</div>}
    <section className="workspace-overview">
      <div><span className="eyebrow">Team progress</span><h2>{board.title}</h2><p>{board.description || "A shared space for the team's work."}</p></div>
      <div className="progress-summary"><div className="progress-ring" style={{ "--progress": `${completion * 3.6}deg` }}><span>{completion}%</span></div><div><strong>{counts.done} of {counts.total}</strong><span>tasks complete</span></div></div>
      <div className="metric-grid"><article><strong>{counts.total}</strong><span>Total tasks</span></article><article><strong>{counts.doing}</strong><span>In progress</span></article><article className={counts.overdue ? "warning" : ""}><strong>{counts.overdue}</strong><span>Overdue</span></article></div>
    </section>
    <section className="workspace-layout">
      <div className="board-area">
        <div className="filter-bar"><label className="search-control"><Icon name="search" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks or tags…" /></label><select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><span>{filteredTasks.length} visible</span></div>
        <KanbanBoard tasks={filteredTasks} canEdit={canEdit} onOpenTask={openTask} onMoveTask={(task, status) => boardState.updateTask(task, { status, progress: status === "done" ? 100 : status === "todo" ? 0 : Math.max(1, Math.min(99, task.progress || 50)), position: Date.now() }).catch(() => {})} onAddTask={(status) => setTaskModal({ open: true, task: null, status })} />
      </div>
      <aside className="activity-rail"><header><div><span className="live-dot" />Live activity</div><Link to="/activity">View all</Link></header><ActivityList activities={activities.slice(0, 7)} compact /></aside>
    </section>
    <TaskModal open={taskModal.open} onClose={closeTask} task={taskModal.task} initialStatus={taskModal.status} board={board} readOnly={!canEdit} onSave={saveTask} onDelete={removeTask} onComment={(message) => boardState.addComment(taskModal.task, message)} />
    <BoardModal open={boardModalOpen} onClose={() => setBoardModalOpen(false)} onCreate={boardState.createBoard} />
    <ConflictDialog conflict={conflict} onClose={boardState.clearConflict} onUseLatest={(latest) => { boardState.clearConflict(); openTask(latest); }} />
  </>;
}
