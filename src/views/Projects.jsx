import { useEffect, useState } from "react";
import { newProject, isWelcomeDismissed, setWelcomeDismissed } from "../lib/store.js";
import { projectMeta, progress } from "../lib/model.js";
import { cloudEnabled, getSubmissions } from "../lib/cloud.js";

export default function Projects({ catalog, projects, setProjects, activeId, activate }) {
  const list = Object.values(projects).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const [syncNote, setSyncNote] = useState(null);
  const [showWelcome, setShowWelcome] = useState(() => !isWelcomeDismissed());

  function toggleWelcome(show) {
    setShowWelcome(show);
    setWelcomeDismissed(!show);
  }

  // Pull in any selections clients made online since the last visit.
  useEffect(() => {
    if (!cloudEnabled) return;
    const shared = Object.values(projects).filter((p) => p.share);
    if (!shared.length) return;
    let cancelled = false;
    (async () => {
      const next = { ...projects };
      let merged = 0;
      for (const p of shared) {
        try {
          const subs = await getSubmissions(p.share);
          const picks = Object.assign({}, ...subs.map((s) => s.picks));
          const fresh = Object.keys(picks).filter((k) => next[p.id].clientPicks?.[k] !== picks[k]);
          if (fresh.length) {
            next[p.id] = { ...next[p.id], clientPicks: { ...(next[p.id].clientPicks || {}), ...picks } };
            merged += fresh.length;
          }
        } catch {
          // Offline or server hiccup — the dashboard still works from local data.
        }
      }
      if (!cancelled && merged) {
        setProjects(next);
        setSyncNote(`Synced ${merged} new client selection${merged === 1 ? "" : "s"}.`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function create() {
    const fresh = newProject();
    setProjects({ ...projects, [fresh.id]: fresh });
    activate(fresh.id);
    location.hash = "#/intake";
  }

  function open(id) {
    activate(id);
    location.hash = "#/intake";
  }

  function duplicate(project) {
    const copy = { ...structuredClone(project), ...newProject() };
    copy.answers = structuredClone(project.answers);
    copy.clientPicks = {};
    if (copy.answers.project?.projectName) {
      copy.answers.project.projectName += " (copy)";
    }
    setProjects({ ...projects, [copy.id]: copy });
  }

  function remove(project) {
    const meta = projectMeta(catalog, project);
    if (!confirm(`Delete "${meta.projectName}"? This can't be undone.`)) return;
    const next = { ...projects };
    delete next[project.id];
    setProjects(next);
  }

  return (
    <main className="projects-wrap">
      <div className="pane-head">
        <span className="pane-div">All projects</span>
        <h1>Projects</h1>
        <p className="pane-hint">
          Every job in one place. Duplicate a finished project to reuse it as a
          template for the next one.
          {syncNote ? <b> {syncNote}</b> : null}
          {!showWelcome && (
            <>
              {" "}
              <button className="link-btn" onClick={() => toggleWelcome(true)}>
                How it works
              </button>
            </>
          )}
        </p>
      </div>

      <div className="projects-layout">
      <div className="project-grid">
        <button className="project-card project-new" onClick={create}>
          <span className="project-new-mark">+</span>
          <span>New project</span>
        </button>

        {list.map((p) => {
          const meta = projectMeta(catalog, p);
          const tally = progress(catalog, p);
          const done = tally.contractor + tally.client;
          const pct = tally.total ? Math.round((done / tally.total) * 100) : 0;
          return (
            <div key={p.id} className={`project-card${p.id === activeId ? " project-active" : ""}`}>
              <div className="project-title">{meta.projectName}</div>
              <div className="project-sub">
                {meta.clientName} · started{" "}
                {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
              <div className="progress" role="img" aria-label={`${pct}% of selections made`}>
                <span className="progress-contractor" style={{ width: `${tally.total ? (tally.contractor / tally.total) * 100 : 0}%` }} />
                <span className="progress-client" style={{ width: `${tally.total ? (tally.client / tally.total) * 100 : 0}%` }} />
              </div>
              <div className="project-stats">
                <span>● {tally.contractor} specified</span>
                <span className="stat-client">◆ {tally.client} by client</span>
                <span className="stat-open">○ {tally.open} open</span>
              </div>
              <div className="project-actions">
                <button className="btn btn-primary btn-small" onClick={() => open(p.id)}>Open</button>
                <button className="btn btn-ghost btn-small" onClick={() => duplicate(p)}>Duplicate</button>
                <button className="btn btn-ghost btn-small" onClick={() => remove(p)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {showWelcome && (
        <aside className="notes">
          <div className="notes-head">
            <h2>General Notes — How This Works</h2>
            <button className="btn btn-ghost btn-small" onClick={() => toggleWelcome(false)}>
              Got it
            </button>
          </div>
          <ol className="notes-list">
            <li>
              <b>Fill out the intake.</b> Answer what's already decided for the job —
              anything you leave blank becomes a choice for your client.
            </li>
            <li>
              <b>Generate the selection sheet.</b> A print-ready schedule: your picks
              marked ●, open items listed with ○ checkboxes. Print it or save as PDF.
            </li>
            <li>
              <b>Send the client link.</b> One click publishes the project and copies a
              link — your client makes their selections on any device.
            </li>
            <li>
              <b>Selections come back on their own.</b> This page syncs them
              automatically and marks them ◆ on the sheet.
            </li>
          </ol>
          <p className="notes-foot">
            The <b>Sample — Alder St Residence</b> project is safe to explore or
            delete. Update materials and questions anytime under <b>Catalog</b> — no
            developer needed.
          </p>
        </aside>
      )}
      </div>
    </main>
  );
}
