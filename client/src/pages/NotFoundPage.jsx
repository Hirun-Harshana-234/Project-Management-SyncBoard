import { Link } from "react-router-dom";
export default function NotFoundPage() { return <main className="not-found"><span>404</span><h1>This page slipped off the board.</h1><p>The link may be old, or the page may have moved.</p><Link className="button primary" to="/">Return to board</Link></main>; }

