// Encode a project + catalog snapshot into a shareable URL fragment so the
// client selection view needs no backend. Images (data URLs) are stripped to
// keep links a sane length; a production build would store these server-side.

function stripImages(answers) {
  const clean = JSON.parse(JSON.stringify(answers));
  for (const value of Object.values(clean)) {
    const rooms = Array.isArray(value) ? value : [value];
    for (const room of rooms) {
      for (const key of Object.keys(room)) {
        if (typeof room[key] === "string" && room[key].startsWith("data:")) delete room[key];
      }
    }
  }
  return clean;
}

export function encodePayload(payload) {
  const json = JSON.stringify(payload);
  return btoa(String.fromCharCode(...new TextEncoder().encode(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function encodeShare(catalog, project) {
  const cleanProject = { ...project, answers: stripImages(project.answers) };
  const encoded = encodePayload({ catalog, project: cleanProject });
  if (encoded.length <= 150_000) return encoded;
  // Too many catalog photos for a URL — drop them and keep swatches.
  const slim = JSON.parse(JSON.stringify(catalog));
  for (const s of slim.sections) {
    for (const q of s.questions) {
      for (const o of q.options || []) delete o.photo;
    }
  }
  return encodePayload({ catalog: slim, project: cleanProject });
}

export function decodeShare(encoded) {
  try {
    const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function clientLink(catalog, project) {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#/client?d=${encodeShare(catalog, project)}`;
}

// Link the client sends back: their picks plus a readable summary.
export function returnLink(project, projectName, picks, summary) {
  const base = `${location.origin}${location.pathname}`;
  return `${base}#/apply?d=${encodePayload({ projectId: project.id, projectName, picks, summary })}`;
}
