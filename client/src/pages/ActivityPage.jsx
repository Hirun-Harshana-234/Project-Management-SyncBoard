import { useBoards } from "../context/BoardContext";
import ActivityList from "../components/ActivityList";

export default function ActivityPage() {
  const { board, activities } = useBoards();
  return <section className="content-section">
    <header className="page-heading"><div><span className="eyebrow">Live audit trail</span><h2>Team activity</h2><p>Every board change is recorded and delivered to connected teammates in real time.</p></div><span className="context-chip">{board?.title || "No board selected"}</span></header>
    <div className="panel activity-page-panel"><ActivityList activities={activities} /></div>
  </section>;
}

