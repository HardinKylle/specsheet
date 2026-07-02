import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { DEFAULT_CATALOG } from "../src/data/defaultCatalog.js";
import { makeSampleProject } from "../src/data/sampleProject.js";
import {
  getAnswer,
  getRoomCount,
  isVisible,
  openSelections,
  pickKey,
  progress,
  resolveAnswer,
  setAnswer,
} from "../src/lib/model.js";

const projectSection = DEFAULT_CATALOG.sections.find((section) => section.id === "project");
const bathroomSection = DEFAULT_CATALOG.sections.find((section) => section.id === "bathroom");
const kitchenSection = DEFAULT_CATALOG.sections.find((section) => section.id === "kitchen");

describe("answer storage", () => {
  test("updates flat answers without mutating the project", () => {
    const project = { answers: { kitchen: { cabinetStyle: "shaker" } } };
    const updated = setAnswer(project, kitchenSection, 0, "cabinetStyle", "flat");

    assert.equal(getAnswer(updated, kitchenSection, 0, "cabinetStyle"), "flat");
    assert.equal(project.answers.kitchen.cabinetStyle, "shaker");
    assert.notEqual(updated.answers, project.answers);
  });

  test("updates one repeatable room without mutating neighboring rooms", () => {
    const project = {
      answers: { bathroom: [{ vanitySize: "v24" }, { vanitySize: "v36" }] },
    };
    const updated = setAnswer(project, bathroomSection, 1, "vanitySize", "v48");

    assert.equal(getAnswer(updated, bathroomSection, 0, "vanitySize"), "v24");
    assert.equal(getAnswer(updated, bathroomSection, 1, "vanitySize"), "v48");
    assert.equal(project.answers.bathroom[1].vanitySize, "v36");
  });
});

describe("catalog-driven selection logic", () => {
  test("derives repeatable room counts from the configured source", () => {
    const project = { answers: { project: { bathroomCount: 3 } } };

    assert.equal(getRoomCount(DEFAULT_CATALOG, project, projectSection), 1);
    assert.equal(getRoomCount(DEFAULT_CATALOG, project, bathroomSection), 3);
  });

  test("clamps negative and excessively large room counts", () => {
    assert.equal(
      getRoomCount(DEFAULT_CATALOG, { answers: { project: { bathroomCount: -2 } } }, bathroomSection),
      0,
    );
    // The bathroomCount question configures max: 6.
    assert.equal(
      getRoomCount(DEFAULT_CATALOG, { answers: { project: { bathroomCount: 99 } } }, bathroomSection),
      6,
    );
  });

  test("evaluates conditional questions within the current room", () => {
    const tubSize = bathroomSection.questions.find((question) => question.id === "tubSize");
    const project = {
      answers: { bathroom: [{ wetArea: "tub" }, { wetArea: "shower" }] },
    };

    assert.equal(isVisible(tubSize, project, bathroomSection, 0), true);
    assert.equal(isVisible(tubSize, project, bathroomSection, 1), false);
  });

  test("gives contractor answers precedence over client picks", () => {
    const question = kitchenSection.questions.find((item) => item.id === "cabinetStyle");
    const project = {
      answers: { kitchen: { cabinetStyle: "shaker" } },
      clientPicks: { [pickKey("kitchen", 0, "cabinetStyle")]: "flat" },
    };

    assert.deepEqual(resolveAnswer(project, kitchenSection, 0, question), {
      value: "shaker",
      by: "contractor",
    });
  });

  test("computes sample project progress and open selections consistently", () => {
    const project = makeSampleProject();
    const open = openSelections(DEFAULT_CATALOG, project);

    assert.deepEqual(progress(DEFAULT_CATALOG, project), {
      total: 18,
      contractor: 11,
      client: 2,
      open: 5,
    });
    assert.deepEqual(
      open.map(({ section, roomIndex, question }) => pickKey(section.id, roomIndex, question.id)),
      [
        "bathroom.0.fixtureFinish",
        "bathroom.1.vanityStyle",
        "bathroom.1.fixtureFinish",
        "kitchen.0.counterMaterial",
        "kitchen.0.backsplash",
      ],
    );
  });
});

test("invalid or removed option IDs remain open instead of counting as client selections", () => {
  const question = kitchenSection.questions.find((item) => item.id === "cabinetStyle");
  const key = pickKey("kitchen", 0, question.id);
  const project = { answers: {}, clientPicks: { [key]: "removed-option" } };

  assert.deepEqual(resolveAnswer(project, kitchenSection, 0, question), {
    value: undefined,
    by: null,
  });
  assert.ok(openSelections(DEFAULT_CATALOG, project).some((item) => pickKey(
    item.section.id,
    item.roomIndex,
    item.question.id,
  ) === key));
});

test("room counts honor the source question's integer range", () => {
  const fractional = { answers: { project: { bathroomCount: 2.5 } } };
  const aboveConfiguredMaximum = { answers: { project: { bathroomCount: 10 } } };

  assert.equal(getRoomCount(DEFAULT_CATALOG, fractional, bathroomSection), 2);
  assert.equal(getRoomCount(DEFAULT_CATALOG, aboveConfiguredMaximum, bathroomSection), 6);
});
