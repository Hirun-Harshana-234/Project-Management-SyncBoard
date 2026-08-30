import { useState } from "react";
import Modal from "./Modal";

const colors = ["#720eec", "#2ea2cc", "#7ad03a", "#ffba00", "#a00"];

export default function BoardModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({ title: "", description: "", color: colors[0] });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) return setError("Enter a board title.");
    setSaving(true); setError("");
    try { await onCreate(form); setForm({ title: "", description: "", color: colors[0] }); onClose(); }
    catch (createError) { setError(createError.message); }
    finally { setSaving(false); }
  }
  return <Modal open={open} onClose={onClose} title="Create a board" eyebrow="New workspace">
    <form className="form-stack" onSubmit={submit}>
      {error && <div className="form-alert">{error}</div>}
      <label>Board title<span>*</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Website launch" autoFocus /></label>
      <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What will the team coordinate here?" /></label>
      <fieldset className="color-field"><legend>Board color</legend><div>{colors.map((color) => <button type="button" key={color} style={{ background: color }} className={form.color === color ? "selected" : ""} onClick={() => setForm({ ...form, color })} aria-label={`Use ${color}`} />)}</div></fieldset>
      <div className="form-actions"><span /><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Creating…" : "Create board"}</button></div>
    </form>
  </Modal>;
}

