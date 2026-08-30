import Avatar from "./Avatar";

export function relativeTime(value) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function ActivityList({ activities, compact = false }) {
  if (!activities?.length) return <div className="empty-state compact"><span>◌</span><h3>No activity yet</h3><p>Changes made by the team will appear here instantly.</p></div>;
  return <div className={`activity-list ${compact ? "compact" : ""}`}>{activities.map((activity) => <article key={activity._id || activity.id}>
    <Avatar user={activity.actor} size="small" />
    <div><p><strong>{activity.actor?.displayName || "Team member"}</strong> {activity.summary}</p><time>{relativeTime(activity.createdAt)}</time></div>
  </article>)}</div>;
}

