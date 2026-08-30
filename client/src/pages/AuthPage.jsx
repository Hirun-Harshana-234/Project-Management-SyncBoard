import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";
import Logo from "../components/Logo";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ displayName: "", username: "", email: "", login: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (user) return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/home"} replace />;

  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function useDemoAccount() { setMode("login"); setForm((current) => ({ ...current, login: "login@pms", password: "pms@123" })); setError(""); }
  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.password || (mode === "login" ? !form.login.trim() : !form.displayName.trim() || !form.username.trim() || !form.email.trim())) return setError("Complete all required fields.");
    setSaving(true);
    try {
      if (mode === "login") await login(form.login.trim(), form.password);
      else await register({ displayName: form.displayName.trim(), username: form.username.trim(), email: form.email.trim(), password: form.password });
      navigate(location.state?.from?.pathname || "/home", { replace: true });
    } catch (authError) { setError(authError.message); }
    finally { setSaving(false); }
  }

  return <main className="auth-page">
    <section className="auth-story">
      <div className="auth-brand"><Logo /></div>
      <div className="auth-copy"><span className="auth-eyebrow">Project clarity, in real time</span><h1>Plan clearly.<br />Deliver together.<br /><em>Stay in sync.</em></h1><p>PMS brings projects, people, tasks, progress, reports, and live team updates into one responsive workspace.</p></div>
      <div className="auth-feature-grid"><article><span>01</span><strong>Project visibility</strong><p>Dashboards, reports, progress, priorities, and due dates in one place.</p></article><article><span>02</span><strong>Safe collaboration</strong><p>JWT sessions, protected routes, comments, roles, and conflict detection.</p></article><article><span>03</span><strong>Always synchronized</strong><p>Socket-powered updates with offline drafts and queued task changes.</p></article></div>
      <div className="auth-orbit"><span /><span /><span /></div>
    </section>
    <section className="auth-panel">
      <form className="auth-card" onSubmit={submit}>
        <div className="mobile-auth-brand"><Logo /></div>
        <span className="eyebrow">{mode === "login" ? "Member access" : "Create your workspace"}</span>
        <h2>{mode === "login" ? "Sign in to PMS" : "Create member account"}</h2>
        <p>{mode === "login" ? "Enter your member details to continue to Project Management SyncBoard." : "A starter project board will be created for your account."}</p>
        {mode === "login" && <button type="button" className="demo-credentials" onClick={useDemoAccount}><span>Demo member</span><strong>login@pms</strong><small>Password: pms@123 · Click to fill</small></button>}
        {error && <div className="form-alert" role="alert">{error}</div>}
        {mode === "register" && <div className="form-row"><label>Full name<input value={form.displayName} onChange={(event) => update("displayName", event.target.value)} autoComplete="name" placeholder="Project member" /></label><label>Username<input value={form.username} onChange={(event) => update("username", event.target.value)} autoComplete="username" placeholder="your@username" /></label></div>}
        {mode === "register" && <label>Email address<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" placeholder="you@example.com" /></label>}
        {mode === "login" && <label>Username<input value={form.login} onChange={(event) => update("login", event.target.value)} autoComplete="username" placeholder="login@pms" autoFocus /></label>}
        <label>Password<input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Enter your password" /></label>
        <button className="button primary auth-submit" disabled={saving}>{saving ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}<Icon name="chevron" size={18} /></button>
        <div className="auth-switch">{mode === "login" ? "Need a member account?" : "Already have an account?"}<button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Register" : "Sign in"}</button></div>
        <Link className="admin-login-link" to="/admin/login"><Icon name="admin" size={17} />Administrator login</Link>
      </form>
    </section>
  </main>;
}
