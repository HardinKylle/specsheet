import { DEFAULT_CATALOG } from "../data/defaultCatalog.js";

const CATALOG_KEY = "specsheet.catalog";
const PROJECT_KEY = "specsheet.project";

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

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

export function emptyProject() {
  return { answers: {}, createdAt: new Date().toISOString() };
}

export function loadProject() {
  return read(PROJECT_KEY, emptyProject());
}

export function saveProject(project) {
  localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
}

export function clearProject() {
  localStorage.removeItem(PROJECT_KEY);
  return emptyProject();
}
