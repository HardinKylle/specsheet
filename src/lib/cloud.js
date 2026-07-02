// Thin client for the Supabase RPC functions in supabase/schema.sql.
// When VITE_SUPABASE_* is not configured the app falls back to the fully
// offline URL-encoded share links.

const BASE = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(BASE && KEY);

async function rpc(fn, args) {
  const res = await fetch(`${BASE}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${fn} failed (${res.status})`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Publish (or republish) a project. Returns { id, write_key }.
// The stored snapshot is client-readable via get_project, so the share
// credentials must never be part of it — the key travels only as an RPC arg.
export function shareProject(catalog, project) {
  const { share, ...publicProject } = project;
  return rpc("share_project", {
    p_data: publicProject,
    p_catalog: catalog,
    p_id: share?.id ?? null,
    p_key: share?.write_key ?? null,
  });
}

// Load a shared project by its link id. Returns { id, data, catalog } or null.
export function getProject(id) {
  return rpc("get_project", { p_id: id });
}

// Record the client's selections.
export function submitSelections(id, picks, summary) {
  return rpc("submit_selections", { p_id: id, p_picks: picks, p_summary: summary });
}

// Contractor-only: list submissions for a shared project.
export function getSubmissions(share) {
  return rpc("get_submissions", { p_id: share.id, p_key: share.write_key });
}

// Workspace: cloud persistence for the contractor's projects/catalog/settings.
export function createWorkspace() {
  return rpc("create_workspace", {});
}

export function loadWorkspace(creds) {
  return rpc("load_workspace", { p_id: creds.id, p_key: creds.key });
}

export function saveWorkspace(creds, state) {
  return rpc("save_workspace", { p_id: creds.id, p_key: creds.key, p_state: state });
}
