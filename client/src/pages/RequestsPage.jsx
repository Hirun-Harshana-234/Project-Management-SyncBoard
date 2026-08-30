import { useEffect, useState } from "react";
import { api } from "../services/api";
import Icon from "../components/Icon";

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ type: "access", subject: "", message: "" });
  const [status, setStatus] = useState("");
  async function load() { try { const data = await api.get("/requests/mine"); setRequests(data.requests); } catch (error) { setStatus(error.message); } }
  useEffect(() => { load(); }, []);
  async function submit(event) {
    event.preventDefault(); setStatus("");
    try { await api.post("/requests", form); setForm({ type: "access", subject: "", message: "" }); setStatus("Request submitted successfully."); await load(); }
    catch (error) { setStatus(error.message); }
  }
  return <section className="content-section requests-page"><header className="page-heading"><div><span className="eyebrow">Administrator support</span><h2>Requests</h2><p>Request project access, a role change, or administrative support and track the response.</p></div></header><div className="request-layout"><form className="panel form-stack request-form" onSubmit={submit}>{status && <div className={status.includes("successfully") ? "success-alert" : "form-alert"}>{status}</div>}<label>Request type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="access">Project access</option><option value="role">Role or permission change</option><option value="support">System support</option></select></label><label>Subject<span>*</span><input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="What do you need?" /></label><label>Details<span>*</span><textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Explain the request and why it is needed…" /></label><button className="button primary" disabled={!form.subject.trim() || !form.message.trim()}><Icon name="request" size={18} />Submit request</button></form><section className="panel request-history"><header><div><h3>Your request history</h3><p>Latest administrator decisions</p></div><span>{requests.length}</span></header><div>{requests.map((item) => <article key={item.id}><div><span className={`request-status ${item.status}`}>{item.status}</span><small>{new Date(item.createdAt).toLocaleString()}</small></div><h4>{item.subject}</h4><p>{item.message}</p>{item.response && <blockquote><strong>Administrator response</strong>{item.response}</blockquote>}</article>)}{!requests.length && <div className="empty-table"><Icon name="request" /><h3>No requests submitted</h3><p>Your submitted requests will appear here.</p></div>}</div></section></div></section>;
}
