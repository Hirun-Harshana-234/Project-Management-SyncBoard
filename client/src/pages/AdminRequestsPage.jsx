import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  async function load() { try { const data = await api.get("/admin/requests"); setRequests(data.requests); } catch (loadError) { setError(loadError.message); } }
  useEffect(() => { load(); }, []);
  async function review(item, status) {
    const response = window.prompt("Optional response to the member:", item.response || "");
    if (response === null) return;
    try { const data = await api.patch(`/admin/requests/${item.id}`, { status, response }); setRequests((current) => current.map((request) => request.id === data.request.id ? data.request : request)); }
    catch (reviewError) { setError(reviewError.message); }
  }
  const visible = useMemo(() => requests.filter((item) => filter === "all" || item.status === filter), [requests, filter]);
  return <section className="content-section admin-requests-page"><header className="page-heading"><div><span className="eyebrow">Member support queue</span><h2>Requests</h2><p>Review access, permission, and support requests, then record an approval or rejection for the member.</p></div><span className="context-chip">{requests.filter((item) => item.status === "pending").length} pending</span></header>{error && <div className="form-alert">{error}</div>}<div className="request-filter"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All <span>{requests.length}</span></button>{["pending", "approved", "rejected"].map((status) => <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>{status} <span>{requests.filter((item) => item.status === status).length}</span></button>)}</div><div className="admin-request-grid">{visible.map((item) => <article className="panel admin-request-card" key={item.id}><header><div className="table-user"><Avatar user={item.requester} size="small" /><div><strong>{item.requester?.displayName}</strong><span>{item.requester?.jobTitle} · @{item.requester?.username}</span></div></div><span className={`request-status ${item.status}`}>{item.status}</span></header><div className="request-type"><Icon name="request" size={16} />{item.type} request · {new Date(item.createdAt).toLocaleString()}</div><h3>{item.subject}</h3><p>{item.message}</p>{item.response && <blockquote><strong>Recorded response</strong>{item.response}</blockquote>}<footer>{item.status !== "approved" && <button className="button success-ghost" onClick={() => review(item, "approved")}>Approve</button>}{item.status !== "rejected" && <button className="button danger-ghost" onClick={() => review(item, "rejected")}>Reject</button>}{item.status !== "pending" && <button className="button secondary" onClick={() => review(item, "pending")}>Reopen</button>}</footer></article>)}{!visible.length && <div className="panel empty-table"><Icon name="request" /><h3>No {filter === "all" ? "" : filter} requests</h3><p>Requests matching this filter will appear here.</p></div>}</div></section>;
}
