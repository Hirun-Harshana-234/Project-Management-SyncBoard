import { useEffect, useState } from "react";
import Modal from "./Modal";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { draftKey } from "../services/offlineStore";
import { categories } from "../utils/tasks";

const blank = { title: "", description: "", status: "todo", priority: "medium", category: "General", progress: 0, assignee: "", dueDate: "", tags: "" };

export default function TaskModal({ open, onClose, task, initialStatus, board, onSave, onDelete, onComment, readOnly = false }) {
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState("");
  const isEditing = Boolean(task);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || "", description: task.description || "", status: task.status || "todo",
        priority: task.priority || "medium", category: task.category || "General", progress: task.progress || 0, assignee: task.assignee?.id || "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "", tags: (task.tags || []).join(", ")
      });
    } else {
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(draftKey(board?.id))); } catch { /* Ignore an invalid draft. */ }
      setForm({ ...blank, ...(saved || {}), status: initialStatus || saved?.status || "todo" });
    }
    setError("");
    setComment("");
  }, [open, task, initialStatus, board?.id]);

  useEffect(() => {
    if (open && !isEditing && board?.id) localStorage.setItem(draftKey(board.id), JSON.stringify(form));
  }, [form, open, isEditing, board?.id]);

  function update(field, value) { setForm((current) => {
    const next = { ...current, [field]: value };
    if (field === "status") next.progress = value === "done" ? 100 : value === "todo" ? 0 : Number(current.progress) === 0 ? 50 : current.progress;
    return next;
  }); }

  async function submit(event) {
    event.preventDefault();
    if (readOnly) return onClose();
    if (!form.title.trim()) return setError("Enter a task title.");
    setSaving(true); setError("");
    try {
      await onSave({
        title: form.title.trim(), description: form.description.trim(), status: form.status, priority: form.priority,
        category: form.category, progress: Number(form.progress),
        assignee: form.assignee || null, dueDate: form.dueDate || null,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      });
      if (!isEditing) localStorage.removeItem(draftKey(board.id));
      onClose();
    } catch (saveError) { if (saveError.status !== 409) setError(saveError.message); }
    finally { setSaving(false); }
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    try { await onComment(comment.trim()); setComment(""); }
    catch (commentError) { setError(commentError.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? "Task details" : "Create a new task"} eyebrow={isEditing ? `Revision ${task.revision}` : "New work item"} width="large">
      <div className={`task-modal-grid ${isEditing ? "editing" : ""}`}>
        <form className="form-stack" onSubmit={submit}>
          {error && <div className="form-alert">{error}</div>}
          {readOnly && <div className="read-only-note">You have view-only access to this board.</div>}
          <label>Task title<span>*</span><input disabled={readOnly} value={form.title} maxLength="160" onChange={(event) => update("title", event.target.value)} placeholder="What needs to be done?" autoFocus /></label>
          <label>Description<textarea disabled={readOnly} value={form.description} maxLength="3000" onChange={(event) => update("description", event.target.value)} placeholder="Add useful context, acceptance criteria, or links…" /></label>
          <div className="form-row">
            <label>Status<select disabled={readOnly} value={form.status} onChange={(event) => update("status", event.target.value)}><option value="todo">Assigned</option><option value="doing">Ongoing</option><option value="done">Done</option></select></label>
            <label>Priority<select disabled={readOnly} value={form.priority} onChange={(event) => update("priority", event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
          </div>
          <div className="form-row">
            <label>Category<select disabled={readOnly} value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>Progress <strong className="range-value">{form.progress}%</strong><input disabled={readOnly} type="range" min="0" max="100" step="5" value={form.progress} onChange={(event) => update("progress", event.target.value)} /></label>
          </div>
          <div className="form-row">
            <label>Assignee<select disabled={readOnly} value={form.assignee} onChange={(event) => update("assignee", event.target.value)}><option value="">Unassigned</option>{board?.members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.displayName}</option>)}</select></label>
            <label>Due date<input disabled={readOnly} type="date" value={form.dueDate} onChange={(event) => update("dueDate", event.target.value)} /></label>
          </div>
          <label>Tags<input disabled={readOnly} value={form.tags} onChange={(event) => update("tags", event.target.value)} placeholder="design, api, urgent" /></label>
          <div className="form-actions">
            {isEditing && !readOnly && <button type="button" className="button danger-ghost" onClick={onDelete}><Icon name="trash" size={17} />Delete</button>}
            <span />
            <button type="button" className="button secondary" onClick={onClose}>{readOnly ? "Close" : "Cancel"}</button>
            {!readOnly && <button type="submit" className="button primary" disabled={saving}>{saving ? "Saving…" : isEditing ? "Save changes" : "Create task"}</button>}
          </div>
        </form>
        {isEditing && <aside className="comments-panel">
          <h3>Discussion <span>{task.comments?.length || 0}</span></h3>
          <div className="comments-list">
            {task.comments?.map((item) => <article key={item.id}><Avatar user={item.author} size="small" /><div><strong>{item.author?.displayName || "Team member"}<time>{new Date(item.createdAt).toLocaleString()}</time></strong><p>{item.message}</p></div></article>)}
            {!task.comments?.length && <div className="empty-comments"><Icon name="comment" /><p>No comments yet. Start the discussion.</p></div>}
          </div>
          {!readOnly && <form className="comment-form" onSubmit={submitComment}><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a comment…" /><button className="button primary" disabled={saving || !comment.trim()}>Send</button></form>}
        </aside>}
      </div>
    </Modal>
  );
}
