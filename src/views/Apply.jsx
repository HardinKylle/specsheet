import { useMemo, useState } from "react";
import { decodeShare } from "../lib/link.js";

// Landing page for the contractor when they open a client's confirmation link:
// shows what the client chose and merges it into the matching project.

export default function Apply({ params, projects, applyClientPicks }) {
  const payload = useMemo(() => decodeShare(params.get("d") || ""), [params]);
  const [error, setError] = useState(null);

  if (!payload?.picks) {
    return (
      <main className="client-wrap">
        <p className="empty-note">This confirmation link is invalid or incomplete.</p>
      </main>
    );
  }

  const known = Boolean(projects[payload.projectId]);

  function apply() {
    if (applyClientPicks(payload.projectId, payload.picks)) {
      location.hash = "#/sheet";
    } else {
      setError("No matching project found on this device — open the link on the computer that created the project.");
    }
  }

  return (
    <main className="client-wrap">
      <div className="client-done">
        <h1>Client selections received</h1>
        <p>
          Your client made {Object.keys(payload.picks).length} selection
          {Object.keys(payload.picks).length === 1 ? "" : "s"} for{" "}
          <b>{payload.projectName || "this project"}</b>.
        </p>
        <ul>
          {payload.summary?.map((line, i) => (
            <li key={i}>
              <span className="done-where">{line.where}</span>
              <b>{line.choice}</b>
            </li>
          ))}
        </ul>
        {error ? (
          <p className="empty-note">{error}</p>
        ) : (
          <button className="btn btn-primary" onClick={apply}>
            Apply to project
          </button>
        )}
        {!known && !error && (
          <p className="client-note">
            Heads up: this project wasn't found on this device, so applying may fail.
          </p>
        )}
      </div>
    </main>
  );
}
