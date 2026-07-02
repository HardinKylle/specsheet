import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";

class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  clear() {
    this.data.clear();
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null;
  }

  removeItem(key) {
    this.data.delete(key);
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }
}

globalThis.localStorage = new MemoryStorage();
localStorage.setItem("specsheet.version", "2");

const {
  getActiveProjectId,
  loadCatalog,
  loadProjects,
  newProject,
  saveCatalog,
  saveProjects,
  setActiveProjectId,
} = await import("../src/lib/store.js");

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("specsheet.version", "2");
});

describe("project storage", () => {
  test("seeds the sample project only on the first visit", () => {
    const projects = loadProjects();
    const [sample] = Object.values(projects);

    assert.equal(Object.keys(projects).length, 1);
    assert.match(sample.answers.project.projectName, /^Sample/);
    assert.equal(getActiveProjectId(), sample.id);

    saveProjects({});
    assert.deepEqual(loadProjects(), {});
  });

  test("migrates a legacy single project into the project map", () => {
    localStorage.setItem("specsheet.seeded", "1");
    localStorage.setItem("specsheet.project", JSON.stringify({
      id: "legacy-id",
      answers: { project: { projectName: "Legacy" } },
    }));

    const projects = loadProjects();

    assert.equal(projects["legacy-id"].answers.project.projectName, "Legacy");
    assert.equal(projects["legacy-id"].clientPicks !== undefined, true);
    assert.equal(getActiveProjectId(), "legacy-id");
    assert.equal(localStorage.getItem("specsheet.project"), null);
  });

  test("creates projects with independent IDs and complete base state", () => {
    const first = newProject();
    const second = newProject();

    assert.notEqual(first.id, second.id);
    assert.deepEqual(first.answers, {});
    assert.deepEqual(first.clientPicks, {});
    assert.ok(!Number.isNaN(Date.parse(first.createdAt)));
  });

  test("sets and clears the active project", () => {
    setActiveProjectId("p1");
    assert.equal(getActiveProjectId(), "p1");

    setActiveProjectId(null);
    assert.equal(getActiveProjectId(), null);
  });
});

describe("catalog storage", () => {
  test("round-trips saved catalogs", () => {
    const catalog = { sections: [{ id: "custom", questions: [] }] };

    saveCatalog(catalog);

    assert.deepEqual(loadCatalog(), catalog);
  });

  test("recovers from invalid JSON", () => {
    localStorage.setItem("specsheet.catalog", "{broken");

    const catalog = loadCatalog();

    assert.ok(catalog.sections.length > 0);
    assert.equal(localStorage.getItem("specsheet.catalog"), null);
  });
});
