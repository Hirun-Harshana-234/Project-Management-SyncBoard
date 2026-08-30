import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import Logo from "../components/Logo";

export default function AdminLoginPage() {
  const { user, login, logout } = useAuth();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;

  async function submit(event) {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      const result = await login(form.login.trim(), form.password);
      if (result.user.role !== "admin") { await logout(); throw new Error("This account does not have administrator permission."); }
      navigate("/admin/dashboard", { replace: true });
    } catch (loginError) { setError(loginError.message); }
    finally { setSaving(false); }
  }
  function fill() { setForm({ login: "admin@login", password: "admin@123" }); setError(""); }

  return <main className="admin-login-page">
    <section className="admin-login-card">
      <Logo />
      <div className="admin-login-icon"><Icon name="admin" size={30} /></div>
      <span className="eyebrow">Restricted access</span><h1>Administrator login</h1><p>Sign in with the dedicated administrator account to manage tasks, members, reports, requests, and system settings.</p>
      <button type="button" className="demo-credentials" onClick={fill}><span>Administrator</span><strong>admin@login</strong><small>Password: admin@123 · Click to fill</small></button>
      <form className="form-stack" onSubmit={submit}>{error && <div className="form-alert">{error}</div>}<label>Admin username<input value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} placeholder="admin@login" autoFocus /></label><label>Admin password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter administrator password" /></label><button className="button primary" disabled={saving}>{saving ? "Verifying…" : "Open admin panel"}<Icon name="chevron" size={18} /></button></form>
      <Link to="/login"><Icon name="chevron" size={16} className="back-icon" />Return to member login</Link>
    </section>
  </main>;
}
