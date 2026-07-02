import { newProject } from "../lib/store.js";
import { projectMeta, progress } from "../lib/model.js";

export default function Projects({ catalog, projects, setProjects, activeId, activate }) {
  const list = Object.values(projects).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

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
        </p>
      </div>

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
    </main>
  );
}
