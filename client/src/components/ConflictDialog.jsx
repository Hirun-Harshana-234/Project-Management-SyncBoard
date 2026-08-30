import Modal from "./Modal";

export default function ConflictDialog({ conflict, onClose, onUseLatest }) {
  const latest = conflict?.latestTask;
  return <Modal open={Boolean(conflict)} onClose={onClose} title="A teammate changed this task" eyebrow="Edit conflict">
    <div className="conflict-content">
      <p>Your change was stopped so that newer work was not overwritten. The latest server version is shown below.</p>
      {latest ? <div className="conflict-latest"><span>Latest version · revision {latest.revision}</span><h3>{latest.title}</h3><p>{latest.description || "No description"}</p><dl><div><dt>Status</dt><dd>{latest.status}</dd></div><div><dt>Priority</dt><dd>{latest.priority}</dd></div></dl></div> : <div className="form-alert">The task no longer exists.</div>}
      <div className="form-actions"><span /><button className="button secondary" onClick={onClose}>Close</button>{latest && <button className="button primary" onClick={() => onUseLatest(latest)}>Open latest version</button>}</div>
    </div>
  </Modal>;
}

