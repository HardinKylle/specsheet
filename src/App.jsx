import { useEffect, useState } from "react";
import Projects from "./views/Projects.jsx";
import Intake from "./views/Intake.jsx";
import Sheet from "./views/Sheet.jsx";
import Client from "./views/Client.jsx";
import Apply from "./views/Apply.jsx";
import Catalog from "./views/Catalog.jsx";
import {
  loadCatalog,
  loadProjects,
  saveProjects,
  newProject,
  getActiveProjectId,
  setActiveProjectId,
  loadSettings,
} from "./lib/store.js";
import { projectMeta } from "./lib/model.js";
import { decodeShare } from "./lib/link.js";

function parseHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [path, query] = hash.split("?");
  return { path: path || "projects", params: new URLSearchParams(query || "") };
}

const TABS = [
  { path: "projects", label: "Projects" },
  { path: "intake", label: "Intake" },
  { path: "sheet", label: "Selection sheet" },
  { path: "catalog", label: "Catalog" },
];

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [catalog, setCatalog] = useState(loadCatalog);
  const [projects, setProjectsState] = useState(loadProjects);
  const [activeId, setActiveId] = useState(getActiveProjectId);
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function setProjects(next) {
    setProjectsState(next);
    saveProjects(next);
  }

  function activate(id) {
    setActiveId(id);
    setActiveProjectId(id);
  }

  const project = projects[activeId] || null;

  function setProject(next) {
    setProjects({ ...projects, [next.id]: next });
  }

  // Intake/sheet need an active project; create one on first visit.
  function ensureProject() {
    if (project) return project;
    const fresh = newProject();
    setProjects({ ...projects, [fresh.id]: fresh });
    activate(fresh.id);
    return fresh;
  }

  function applyClientPicks(projectId, picks) {
    const target = projects[projectId];
    if (!target) return false;
    setProjects({
      ...projects,
      [projectId]: { ...target, clientPicks: { ...(target.clientPicks || {}), ...picks } },
    });
    activate(projectId);
    return true;
  }

  const isClient = route.path === "client";
  // The client opens their link on their own device — header meta must come
  // from the shared payload there, never from this browser's stored projects.
  const shared = isClient ? decodeShare(route.params.get("d") || "") : null;
  const metaSource = shared?.project || project;
  const meta = metaSource
    ? projectMeta(catalog, metaSource)
    : { projectName: "—", clientName: "—" };
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className={`app${isClient ? " app-client" : ""}`}>
      <header className="titleblock">
        <div className="tb-brand">
          {settings.logo ? (
            <img className="tb-logo" src={settings.logo} alt="" />
          ) : (
            <span className="tb-mark">SS</span>
          )}
          <div>
            <strong>{settings.companyName || "SpecSheet"}</strong>
            <span className="tb-tag">{settings.contactLine || "Material Selection Schedules"}</span>
          </div>
        </div>
        <dl className="tb-fields">
          <div><dt>Project</dt><dd>{meta.projectName}</dd></div>
          <div><dt>Client</dt><dd>{meta.clientName}</dd></div>
          <div><dt>Date</dt><dd>{today}</dd></div>
          <div><dt>Sheet</dt><dd>FS-01 · Rev A</dd></div>
        </dl>
        {!isClient && (
          <nav className="tb-nav">
            {TABS.map((t) => (
              <a key={t.path} href={`#/${t.path}`} className={route.path === t.path ? "active" : ""}>
                {t.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {route.path === "projects" && (
        <Projects
          catalog={catalog}
          projects={projects}
          setProjects={setProjects}
          activeId={activeId}
          activate={activate}
        />
      )}
      {route.path === "intake" && (
        <Intake catalog={catalog} project={ensureProject()} setProject={setProject} />
      )}
      {route.path === "sheet" && (
        <Sheet catalog={catalog} project={ensureProject()} settings={settings} />
      )}
      {route.path === "catalog" && (
        <Catalog catalog={catalog} setCatalog={setCatalog} settings={settings} setSettings={setSettings} />
      )}
      {route.path === "apply" && (
        <Apply params={route.params} projects={projects} applyClientPicks={applyClientPicks} />
      )}
      {isClient && <Client params={route.params} />}
    </div>
  );
}
