import { useEffect, useState } from "react";
import Intake from "./views/Intake.jsx";
import Sheet from "./views/Sheet.jsx";
import Client from "./views/Client.jsx";
import Catalog from "./views/Catalog.jsx";
import { loadCatalog, loadProject, saveProject } from "./lib/store.js";
import { projectMeta } from "./lib/model.js";

function parseHash() {
  const hash = location.hash.replace(/^#\/?/, "");
  const [path, query] = hash.split("?");
  return { path: path || "intake", params: new URLSearchParams(query || "") };
}

const TABS = [
  { path: "intake", label: "Intake" },
  { path: "sheet", label: "Selection sheet" },
  { path: "catalog", label: "Catalog" },
];

export default function App() {
  const [route, setRoute] = useState(parseHash());
  const [catalog, setCatalog] = useState(loadCatalog);
  const [project, setProjectState] = useState(loadProject);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function setProject(next) {
    setProjectState(next);
    saveProject(next);
  }

  const meta = projectMeta(catalog, project);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const isClient = route.path === "client";

  return (
    <div className={`app${isClient ? " app-client" : ""}`}>
      <header className="titleblock">
        <div className="tb-brand">
          <span className="tb-mark">SS</span>
          <div>
            <strong>SpecSheet</strong>
            <span className="tb-tag">Material Selection Schedules</span>
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

      {route.path === "intake" && (
        <Intake catalog={catalog} project={project} setProject={setProject} />
      )}
      {route.path === "sheet" && <Sheet catalog={catalog} project={project} />}
      {route.path === "catalog" && <Catalog catalog={catalog} setCatalog={setCatalog} />}
      {isClient && <Client params={route.params} />}
    </div>
  );
}
