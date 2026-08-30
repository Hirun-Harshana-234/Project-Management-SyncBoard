import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBoards } from "../context/BoardContext";
import Avatar from "./Avatar";
import Icon from "./Icon";
import Logo from "./Logo";

const nav = [
  { to: "/home", label: "Home", icon: "home" },
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/board", label: "Project Board", icon: "board" },
  { to: "/tasks", label: "Tasks", icon: "tasks" },
  { to: "/add-task", label: "Add Task", icon: "plus" },
  { to: "/members", label: "Members", icon: "team" },
  { to: "/reports", label: "Reports", icon: "reports" },
  { to: "/notifications", label: "Notifications", icon: "bell" },
  { to: "/request-admin", label: "Requests", icon: "request" },
  { to: "/settings", label: "Settings", icon: "settings" }
];

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { board, activities, isOffline, pendingCount } = useBoards();
  const location = useLocation();
  const [readAt, setReadAt] = useState(() => Number(localStorage.getItem("pms:notificationsReadAt") || 0));
  useEffect(() => {
    const markRead = () => setReadAt(Number(localStorage.getItem("pms:notificationsReadAt") || Date.now()));
    window.addEventListener("pms:notifications-read", markRead);
    return () => window.removeEventListener("pms:notifications-read", markRead);
  }, []);
  const current = nav.find((item) => item.to === location.pathname);
  const title = current?.label || (location.pathname === "/profile" ? "Profile" : board?.title || "PMS");
  const unread = useMemo(() => {
    return activities.filter((item) => new Date(item.createdAt).getTime() > readAt).length;
  }, [activities, readAt]);

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
      <div className="brand"><Logo /></div>
      <nav className="main-nav" aria-label="Member navigation">
        {nav.map((item) => <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}><Icon name={item.icon} /><span>{item.label}</span>{item.to === "/notifications" && unread > 0 && <b className="nav-badge">{Math.min(unread, 99)}</b>}</NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <Link className="sidebar-profile" to="/profile"><Avatar user={user} /><div><strong>{user?.displayName}</strong><small>{user?.jobTitle || `@${user?.username}`}</small></div></Link>
        <button className="sidebar-logout" onClick={logout}><Icon name="logout" /><span>Sign out</span></button>
      </div>
    </aside>
    {menuOpen && <button className="sidebar-overlay" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
    <div className="app-main">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
        <div><span className="topbar-kicker">PMS Workspace</span><h1>{title}</h1></div>
        <div className="topbar-actions">
          {(isOffline || pendingCount > 0) && <span className="sync-pill"><Icon name="wifiOff" size={16} />{pendingCount ? `${pendingCount} pending` : "Offline"}</span>}
          <NavLink className="topbar-notifications" to="/notifications" aria-label="Notifications"><Icon name="bell" size={19} />{unread > 0 && <span>{Math.min(unread, 9)}</span>}</NavLink>
          <Avatar user={user} size="small" />
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
    </div>
    <Link className="admin-fab" to="/admin/login" title="Open administrator panel" aria-label="Open administrator panel"><Icon name="admin" /><span>Admin</span></Link>
  </div>;
}
