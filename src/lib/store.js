import { DEFAULT_CATALOG } from "../data/defaultCatalog.js";
import { makeSampleProject } from "../data/sampleProject.js";

// Bump when the stored data shape changes incompatibly: mismatched stores are
// cleared on load so stale data can never wedge the UI.
const SCHEMA_VERSION = "2";
const VERSION_KEY = "specsheet.version";

const CATALOG_KEY = "specsheet.catalog";
const PROJECTS_KEY = "specsheet.projects";
const ACTIVE_KEY = "specsheet.activeProject";
const SETTINGS_KEY = "specsheet.settings";
const LEGACY_PROJECT_KEY = "specsheet.project";
const SEEDED_KEY = "specsheet.seeded";
const WELCOME_KEY = "specsheet.welcomeDismissed";

export function isWelcomeDismissed() {
  return localStorage.getItem(WELCOME_KEY) === "1";
}

export function setWelcomeDismissed(dismissed) {
  if (dismissed) localStorage.setItem(WELCOME_KEY, "1");
  else localStorage.removeItem(WELCOME_KEY);
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

export function clearAllData() {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("specsheet.")) localStorage.removeItem(key);
  }
}

(function migrateSchema() {
  if (localStorage.getItem(VERSION_KEY) !== SCHEMA_VERSION) {
    // v1 -> v2 keeps the catalog and the legacy single project (loadProjects
    // migrates it); anything else incompatible is dropped.
    localStorage.removeItem(PROJECTS_KEY);
    localStorage.setItem(VERSION_KEY, SCHEMA_VERSION);
  }
})();

export function loadCatalog() {
  return read(CATALOG_KEY, DEFAULT_CATALOG);
}

export function saveCatalog(catalog) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
}

export function resetCatalog() {
  localStorage.removeItem(CATALOG_KEY);
  return DEFAULT_CATALOG;
}

export function newProject() {
  return {
    id: `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    answers: {},
    clientPicks: {},
  };
}

export function loadProjects() {
  const projects = read(PROJECTS_KEY, null);
  if (projects) return projects;

  // Migrate the original single-project storage into the project map.
  const legacy = read(LEGACY_PROJECT_KEY, null);
  if (legacy) {
    const migrated = { ...newProject(), ...legacy };
    localStorage.removeItem(LEGACY_PROJECT_KEY);
    const map = { [migrated.id]: migrated };
    saveProjects(map);
    setActiveProjectId(migrated.id);
    return map;
  }

  // First visit: seed a sample project (once — deleting it doesn't respawn it).
  if (!localStorage.getItem(SEEDED_KEY)) {
    localStorage.setItem(SEEDED_KEY, "1");
    const sample = makeSampleProject();
    const map = { [sample.id]: sample };
    saveProjects(map);
    setActiveProjectId(sample.id);
    return map;
  }
  return {};
}

export function saveProjects(projects) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getActiveProjectId() {
  return localStorage.getItem(ACTIVE_KEY) || null;
}

export function setActiveProjectId(id) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function loadSettings() {
  return read(SETTINGS_KEY, { companyName: "", contactLine: "", logo: undefined });
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
