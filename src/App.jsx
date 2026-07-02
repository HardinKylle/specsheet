import { useEffect, useRef, useState } from "react";
import Projects from "./views/Projects.jsx";
import Intake from "./views/Intake.jsx";
import Sheet from "./views/Sheet.jsx";
import Client from "./views/Client.jsx";
import Apply from "./views/Apply.jsx";
import Catalog from "./views/Catalog.jsx";
import {
  loadCatalog,
  saveCatalog,
  loadProjects,
  saveProjects,
  newProject,
  getActiveProjectId,
  setActiveProjectId,
  loadSettings,
  saveSettings,
  getWorkspaceCreds,
  setWorkspaceCreds,
  codeToCreds,
} from "./lib/store.js";
import { projectMeta } from "./lib/model.js";
import { decodeShare } from "./lib/link.js";
import { cloudEnabled, createWorkspace, loadWorkspace, saveWorkspace } from "./lib/cloud.js";

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
  const [clientPayload, setClientPayload] = useState(null);
  const [workspace, setWorkspace] = useState(getWorkspaceCreds);
  const syncReady = useRef(false);
  const saveTimer = useRef();

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function hydrate(state) {
    if (state.projects) {
      setProjectsState(state.projects);
      saveProjects(state.projects);
      if (!state.projects[getActiveProjectId()]) {
        const first = Object.keys(state.projects)[0] || null;
        setActiveId(first);
        setActiveProjectId(first);
      }
    }
    if (state.catalog) {
      setCatalog(state.catalog);
      saveCatalog(state.catalog);
    }
    if (state.settings) {
      setSettings(state.settings);
      saveSettings(state.settings);
    }
  }

  // Boot: the Supabase workspace is the source of truth for contractor data;
  // localStorage acts as cache. First run creates a workspace and pushes the
  // local (seeded) state up.
  useEffect(() => {
    if (!cloudEnabled || route.path === "client") return;
    let cancelled = false;
    (async () => {
      try {
        let creds = workspace;
        if (!creds) {
          creds = await createWorkspace();
          if (cancelled) return;
          setWorkspaceCreds(creds);
          setWorkspace(creds);
          await saveWorkspace(creds, { projects, catalog, settings });
        } else {
          const state = await loadWorkspace(creds);
          if (cancelled) return;
          if (state && Object.keys(state.projects || {}).length) {
            hydrate(state);
          } else {
            await saveWorkspace(creds, { projects, catalog, settings });
          }
        }
        syncReady.current = true;
      } catch {
        // Offline — keep working from the local cache; autosave stays off.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Autosave the workspace after changes settle.
  useEffect(() => {
    if (!cloudEnabled || !syncReady.current || !workspace) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveWorkspace(workspace, { projects, catalog, settings }).catch(() => {});
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [projects, catalog, settings, workspace]);

  // Connect this device to an existing workspace via its sync code.
  async function connectWorkspace(code) {
    const creds = codeToCreds(code);
    if (!creds) return "That code doesn't look right — it should be two UUIDs joined by a dot.";
    try {
      const state = await loadWorkspace(creds);
      if (state === null) return "No workspace found for that code.";
      setWorkspaceCreds(creds);
      setWorkspace(creds);
      hydrate(state || {});
      syncReady.current = true;
      return null;
    } catch {
      return "Couldn't reach the server — try again.";
    }
  }

  // Accepts a map or an updater function — async callers (dashboard sync) must
  // merge against the latest state, not a snapshot from before their await.
  function setProjects(next) {
    setProjectsState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      saveProjects(value);
      return value;
    });
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
  // from the shared payload (decoded ?d= or the fetched cloud project reported
  // back by the Client view), never from this browser's stored projects.
  const shared = isClient
    ? route.params.get("d")
      ? decodeShare(route.params.get("d"))
      : clientPayload
    : null;
  const metaSource = isClient ? shared?.project : project;
  const meta = metaSource
    ? projectMeta(shared?.catalog || catalog, metaSource)
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
        <Sheet catalog={catalog} project={ensureProject()} setProject={setProject} settings={settings} />
      )}
      {route.path === "catalog" && (
        <Catalog
          catalog={catalog}
          setCatalog={setCatalog}
          settings={settings}
          setSettings={setSettings}
          workspace={workspace}
          connectWorkspace={connectWorkspace}
        />
      )}
      {route.path === "apply" && (
        <Apply params={route.params} projects={projects} applyClientPicks={applyClientPicks} />
      )}
      {isClient && <Client params={route.params} onLoaded={setClientPayload} />}
    </div>
  );
}
