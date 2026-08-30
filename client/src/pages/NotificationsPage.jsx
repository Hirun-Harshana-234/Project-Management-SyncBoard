import { useEffect, useState } from "react";
import { useBoards } from "../context/BoardContext";
import ActivityList from "../components/ActivityList";
import Icon from "../components/Icon";

export default function NotificationsPage() {
  const { board, activities, isOffline, pendingCount } = useBoards();
  const [readAt] = useState(() => Number(localStorage.getItem("pms:notificationsReadAt") || 0));
  useEffect(() => { localStorage.setItem("pms:notificationsReadAt", String(Date.now())); window.dispatchEvent(new Event("pms:notifications-read")); }, []);
  const unread = activities.filter((item) => new Date(item.createdAt).getTime() > readAt).length;
  return <section className="content-section notifications-page">
    <header className="page-heading"><div><span className="eyebrow">System and task updates</span><h2>Notifications</h2><p>See shared task, comment, board, and member activity for the current project.</p></div><span className="context-chip">{unread} new</span></header>
    {(isOffline || pendingCount > 0) && <div className="notification-callout warning"><Icon name="wifiOff" /><div><strong>{isOffline ? "You are working offline" : "Changes are waiting to sync"}</strong><p>{pendingCount ? `${pendingCount} local change${pendingCount === 1 ? "" : "s"} will synchronize when the connection is available.` : "Cached project data remains available on this device."}</p></div></div>}
    <div className="notification-callout"><Icon name="bell" /><div><strong>{board?.title || "Current project"}</strong><p>New entries are delivered to connected sessions in real time. Opening this page marks all current items as read.</p></div></div>
    <div className="panel notifications-list"><ActivityList activities={activities} />{!activities.length && <div className="empty-table"><Icon name="bell" /><h3>No notifications yet</h3><p>Project actions and comments will appear here.</p></div>}</div>
  </section>;
}
