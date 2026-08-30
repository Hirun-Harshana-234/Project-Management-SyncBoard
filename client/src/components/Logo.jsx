export default function Logo({ compact = false, className = "" }) {
  return <span className={`pms-logo ${compact ? "compact" : ""} ${className}`}>
    <img src="/pms-logo.svg" alt="" />
    {!compact && <span><strong>PMS</strong><small>Project Management SyncBoard</small></span>}
  </span>;
}
