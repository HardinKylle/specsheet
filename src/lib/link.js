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

export function encodeShare(catalog, project) {
  const payload = { catalog, project: { ...project, answers: stripImages(project.answers) } };
  const json = JSON.stringify(payload);
  return btoa(String.fromCharCode(...new TextEncoder().encode(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
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
