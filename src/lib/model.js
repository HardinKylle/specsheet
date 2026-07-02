// Shared helpers for reading/writing answers and resolving the project shape.
//
// Answer storage shape:
//   answers[sectionId] = { [questionId]: value }            for flat sections
//   answers[sectionId] = [ { [questionId]: value }, ... ]   for repeatable sections
// Choice values are option ids; image values are data URLs.

export function getRoomCount(catalog, project, section) {
  if (!section.repeatable) return 1;
  const source = findCountSource(catalog, section);
  if (!source) return 1;
  const value = Number(project.answers[source.sectionId]?.[source.questionId]);
  return Number.isFinite(value) ? Math.max(0, Math.min(value, 12)) : 0;
}

function findCountSource(catalog, section) {
  for (const s of catalog.sections) {
    if (s.repeatable) continue;
    const q = s.questions.find((q) => q.id === section.countFrom);
    if (q) return { sectionId: s.id, questionId: q.id };
  }
  return null;
}

export function getAnswer(project, section, roomIndex, questionId) {
  const bucket = project.answers[section.id];
  if (section.repeatable) return bucket?.[roomIndex]?.[questionId];
  return bucket?.[questionId];
}

export function setAnswer(project, section, roomIndex, questionId, value) {
  const answers = { ...project.answers };
  if (section.repeatable) {
    const rooms = [...(answers[section.id] || [])];
    rooms[roomIndex] = { ...(rooms[roomIndex] || {}), [questionId]: value };
    answers[section.id] = rooms;
  } else {
    answers[section.id] = { ...(answers[section.id] || {}), [questionId]: value };
  }
  return { ...project, answers };
}

export function isVisible(question, project, section, roomIndex) {
  if (!question.showIf) return true;
  const current = getAnswer(project, section, roomIndex, question.showIf.question);
  return question.showIf.values.includes(current);
}

export function optionLabel(question, value) {
  return question.options?.find((o) => o.id === value)?.label ?? value;
}

export function projectMeta(catalog, project) {
  const info = project.answers.project || {};
  return {
    projectName: info.projectName || "Untitled project",
    clientName: info.clientName || "—",
    siteAddress: info.siteAddress || "—",
  };
}

export function pickKey(sectionId, roomIndex, questionId) {
  return `${sectionId}.${roomIndex}.${questionId}`;
}

// An item is resolved by the contractor's answer first, then a client pick.
export function resolveAnswer(project, section, roomIndex, question) {
  const own = getAnswer(project, section, roomIndex, question.id);
  if (own !== undefined && own !== "") return { value: own, by: "contractor" };
  const pick = project.clientPicks?.[pickKey(section.id, roomIndex, question.id)];
  if (pick) return { value: pick, by: "client" };
  return { value: undefined, by: null };
}

// Questions the client still needs to decide: visible, unresolved choice questions.
export function openSelections(catalog, project) {
  const open = [];
  for (const section of catalog.sections) {
    if (section.id === "project") continue;
    const count = getRoomCount(catalog, project, section);
    for (let i = 0; i < count; i++) {
      for (const q of section.questions) {
        if (q.type !== "choice") continue;
        if (!isVisible(q, project, section, i)) continue;
        if (!resolveAnswer(project, section, i, q).value) open.push({ section, roomIndex: i, question: q });
      }
    }
  }
  return open;
}

// Selection progress across all visible choice questions.
export function progress(catalog, project) {
  const tally = { total: 0, contractor: 0, client: 0, open: 0 };
  for (const section of catalog.sections) {
    if (section.id === "project") continue;
    const count = getRoomCount(catalog, project, section);
    for (let i = 0; i < count; i++) {
      for (const q of section.questions) {
        if (q.type !== "choice") continue;
        if (!isVisible(q, project, section, i)) continue;
        tally.total++;
        const { by } = resolveAnswer(project, section, i, q);
        if (by === "contractor") tally.contractor++;
        else if (by === "client") tally.client++;
        else tally.open++;
      }
    }
  }
  return tally;
}
