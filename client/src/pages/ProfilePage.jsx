import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";

const colors = ["#720eec", "#2ea2cc", "#7ad03a", "#ffba00", "#a00"];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ displayName: "", email: "", avatarColor: "#720eec" });
  const [status, setStatus] = useState("");
  useEffect(() => { if (user) setForm({ displayName: user.displayName, email: user.email, avatarColor: user.avatarColor }); }, [user]);
  async function submit(event) { event.preventDefault(); setStatus(""); try { await updateProfile(form); setStatus("Profile saved successfully."); } catch (error) { setStatus(error.message); } }
  return <section className="content-section narrow">
    <header className="page-heading"><div><span className="eyebrow">Personal settings</span><h2>Your profile</h2><p>Keep your identity recognizable to the people collaborating with you.</p></div></header>
    <div className="profile-layout"><aside className="profile-preview"><Avatar user={{ ...user, ...form }} size="xlarge" /><h3>{form.displayName || user.username}</h3><p>@{user.username}</p><span>{user.role}</span></aside><form className="panel form-stack" onSubmit={submit}>{status && <div className={status.includes("successfully") ? "success-alert" : "form-alert"}>{status}</div>}<label>Display name<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></label><label>Email address<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><fieldset className="color-field"><legend>Avatar color</legend><div>{colors.map((color) => <button type="button" key={color} style={{ background: color }} className={form.avatarColor === color ? "selected" : ""} onClick={() => setForm({ ...form, avatarColor: color })} aria-label={`Use ${color}`} />)}</div></fieldset><div className="account-facts"><div><span>Username</span><strong>@{user.username}</strong></div><div><span>Account role</span><strong>{user.role}</strong></div><div><span>Member since</span><strong>{new Date(user.createdAt).toLocaleDateString()}</strong></div></div><div className="form-actions"><span /><button className="button primary">Save profile</button></div></form></div>
  </section>;
}

