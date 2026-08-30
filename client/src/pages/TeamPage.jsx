import { useEffect, useMemo, useState } from "react";
import { useBoards } from "../context/BoardContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Avatar from "../components/Avatar";
import Icon from "../components/Icon";
import Modal from "../components/Modal";

export default function TeamPage() {
  const { board, onlineUserIds, addMember, removeMember } = useBoards();
  const { user: currentUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState({ userId: "", role: "editor" });
  const [error, setError] = useState("");
  const canManage = board?.owner?.id === currentUser?.id || currentUser?.role === "admin";

  useEffect(() => {
    if (!modalOpen) return;
    const timer = setTimeout(async () => {
      try { const data = await api.get(`/users?search=${encodeURIComponent(search)}`); setUsers(data.users.filter((user) => !board.members.some((member) => member.user.id === user.id))); }
      catch (loadError) { setError(loadError.message); }
    }, 250);
    return () => clearTimeout(timer);
  }, [search, modalOpen, board]);

  const sortedMembers = useMemo(() => [...(board?.members || [])].sort((a, b) => Number(onlineUserIds.includes(b.user.id)) - Number(onlineUserIds.includes(a.user.id))), [board, onlineUserIds]);
  if (!board) return <div className="empty-state"><h2>No board selected</h2></div>;

  async function submit(event) {
    event.preventDefault(); setError("");
    try { await addMember(selection.userId, selection.role); setModalOpen(false); setSelection({ userId: "", role: "editor" }); }
    catch (addError) { setError(addError.message); }
  }

  return <section className="content-section">
    <header className="page-heading"><div><span className="eyebrow">People, roles, and progress</span><h2>{board.title} members</h2><p>See project roles, departments, individual progress, online presence, and board permissions.</p></div>{canManage && <button className="button primary" onClick={() => setModalOpen(true)}><Icon name="plus" size={18} />Add member</button>}</header>
    <div className="team-grid">{sortedMembers.map((member) => <article className="member-card" key={member.user.id}><div className="member-card-head"><Avatar user={member.user} size="large" showStatus online={onlineUserIds.includes(member.user.id)} /><span className={`member-role role-${member.role}`}>{member.role}</span></div><h3>{member.user.displayName}</h3><p>{member.user.jobTitle || "Project Member"}</p><a href={`mailto:${member.user.email}`}>{member.user.email}</a><div className="member-department">{member.user.department || "Project Team"}</div><div className="member-progress"><div><span style={{ width: `${member.user.progress || 0}%` }} /></div><b>{member.user.progress || 0}%</b></div><footer><span className={onlineUserIds.includes(member.user.id) ? "online-text" : ""}>{onlineUserIds.includes(member.user.id) ? "Online now" : `Last seen ${member.user.lastSeenAt ? new Date(member.user.lastSeenAt).toLocaleDateString() : "recently"}`}</span>{member.role !== "owner" && canManage && <button className="text-danger" onClick={() => window.confirm(`Remove ${member.user.displayName}?`) && removeMember(member.user.id)}>Remove</button>}</footer></article>)}</div>
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add a teammate" eyebrow="Board access">
      <form className="form-stack" onSubmit={submit}>{error && <div className="form-alert">{error}</div>}<label>Search users<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, username, or email" autoFocus /></label><label>Select user<select value={selection.userId} onChange={(event) => setSelection({ ...selection, userId: event.target.value })}><option value="">Choose a user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.displayName} · @{user.username}</option>)}</select></label><label>Board role<select value={selection.role} onChange={(event) => setSelection({ ...selection, role: event.target.value })}><option value="editor">Editor — can create and update tasks</option><option value="viewer">Viewer — read-only access</option></select></label><div className="form-actions"><span /><button type="button" className="button secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="button primary" disabled={!selection.userId}>Add to board</button></div></form>
    </Modal>
  </section>;
}
