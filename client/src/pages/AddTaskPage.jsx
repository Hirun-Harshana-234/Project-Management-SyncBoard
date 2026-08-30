import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBoards } from "../context/BoardContext";
import Icon from "../components/Icon";
import { categories } from "../utils/tasks";

const empty = { title: "", description: "", assignee: "", status: "todo", progress: 0, priority: "medium", category: "General", dueDate: "", tags: "" };

export default function AddTaskPage({ adminMode = false }) {
  const { boards, board, loadBoard, createTask } = useBoards();
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === "status") next.progress = value === "done" ? 100 : value === "doing" && Number(current.progress) === 0 ? 50 : value === "todo" ? 0 : current.progress;
      return next;
    });
  }
  async function submit(event) {
    event.preventDefault(); setMessage("");
    if (!form.title.trim()) return setMessage("Enter a task title.");
    setSaving(true);
    try {
      await createTask({ ...form, title: form.title.trim(), description: form.description.trim(), assignee: form.assignee || null, dueDate: form.dueDate || null, progress: Number(form.progress), tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) });
      setForm(empty); setMessage("Task created successfully.");
      setTimeout(() => navigate(adminMode ? "/admin/tasks" : "/tasks"), 550);
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  }
  return <section className="content-section narrow add-task-page">
    <header className="page-heading"><div><span className="eyebrow">{adminMode ? "Administrator action" : "New project work"}</span><h2>Add a task</h2><p>Create a fully assigned task with a category, status, progress, priority, due date, and supporting description.</p></div></header>
    <form className="panel form-stack add-task-form" onSubmit={submit}>{message && <div className={message.includes("successfully") ? "success-alert" : "form-alert"}>{message}</div>}<label>Project board<span>*</span><select value={board?.id || ""} onChange={(event) => loadBoard(event.target.value)}>{boards.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label>Task title<span>*</span><input value={form.title} maxLength="160" onChange={(event) => update("title", event.target.value)} placeholder="What needs to be delivered?" autoFocus /></label><label>Description<textarea value={form.description} maxLength="3000" onChange={(event) => update("description", event.target.value)} placeholder="Add context, requirements, acceptance criteria, or helpful links…" /></label><div className="form-row"><label>Assigned member<select value={form.assignee} onChange={(event) => update("assignee", event.target.value)}><option value="">Unassigned</option>{board?.members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.displayName} — {member.user.jobTitle}</option>)}</select></label><label>Category<select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="form-row"><label>Status<select value={form.status} onChange={(event) => update("status", event.target.value)}><option value="todo">Assigned</option><option value="doing">Ongoing</option><option value="done">Done</option></select></label><label>Priority<select value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div><div className="form-row"><label>Progress <strong className="range-value">{form.progress}%</strong><input type="range" min="0" max="100" step="5" value={form.progress} onChange={(event) => update("progress", event.target.value)} /></label><label>Due date<input type="date" value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} /></label></div><label>Tags<input value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="api, interface, urgent" /></label><div className="form-actions"><span /><button type="button" className="button secondary" onClick={() => navigate(adminMode ? "/admin/tasks" : "/tasks")}>Cancel</button><button className="button primary" disabled={saving}><Icon name="plus" size={18} />{saving ? "Creating…" : "Create task"}</button></div></form>
  </section>;
}
