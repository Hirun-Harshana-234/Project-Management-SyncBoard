import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";

export default function AdminMembersPage() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  async function load() { try { const data = await api.get("/admin/users"); setUsers(data.users); } catch (loadError) { setError(loadError.message); } }
  useEffect(() => { load(); }, []);
  async function updateUser(user, changes) { try { const result = await api.patch(`/admin/users/${user.id}`, changes); setUsers((current) => current.map((item) => item.id === result.user.id ? result.user : item)); } catch (updateError) { setError(updateError.message); } }
  const filtered = useMemo(() => users.filter((user) => `${user.displayName} ${user.username} ${user.email} ${user.jobTitle} ${user.department}`.toLowerCase().includes(query.toLowerCase())), [users, query]);
  return <section className="content-section admin-members-page"><header className="page-heading"><div><span className="eyebrow">People and permissions</span><h2>Member management</h2><p>Review every PMS account, project role, department, progress, activity state, and system access level.</p></div><span className="admin-badge">{users.length} accounts</span></header>{error && <div className="form-alert">{error}</div>}<div className="panel admin-users"><div className="panel-heading"><label className="search-control"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search members…" /></label><span>{filtered.length} visible</span></div><div className="responsive-table"><table><thead><tr><th>Member</th><th>Project role</th><th>Department</th><th>Progress</th><th>System role</th><th>Access</th><th>Joined</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><div className="table-user"><Avatar user={user} size="small" /><div><strong>{user.displayName}</strong><span>@{user.username} · {user.email}</span></div></div></td><td>{user.jobTitle || "Project Member"}</td><td>{user.department || "Project Team"}</td><td><div className="table-progress"><div><span style={{ width: `${user.progress || 0}%` }} /></div><b>{user.progress || 0}%</b></div></td><td><select value={user.role} onChange={(event) => updateUser(user, { role: event.target.value })}><option value="user">Member</option><option value="admin">Admin</option></select></td><td><label className="switch"><input type="checkbox" checked={user.active} onChange={(event) => updateUser(user, { active: event.target.checked })} /><span /></label></td><td>{new Date(user.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></div></section>;
}
