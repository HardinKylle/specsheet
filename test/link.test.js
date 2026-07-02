import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  clientLink,
  decodeShare,
  encodePayload,
  encodeShare,
  returnLink,
} from "../src/lib/link.js";

globalThis.location = {
  origin: "https://example.test",
  pathname: "/specsheet/",
};

describe("share payload encoding", () => {
  test("round-trips Unicode data in a URL-safe format", () => {
    const payload = { projectName: "Café remodel 🛁", client: "李" };
    const encoded = encodePayload(payload);

    assert.doesNotMatch(encoded, /[+/=]/);
    assert.deepEqual(decodeShare(encoded), payload);
  });

  test("returns null for malformed payloads", () => {
    assert.equal(decodeShare("not-valid-json"), null);
  });

  test("removes answer data URLs without modifying the source project", () => {
    const photo = "data:image/jpeg;base64,abc123";
    const catalog = { sections: [] };
    const project = {
      id: "project-1",
      answers: {
        project: { projectName: "Photo test" },
        bathroom: [{ tubPhoto: photo, tubSize: "60 x 32" }],
      },
      clientPicks: {},
    };

    const decoded = decodeShare(encodeShare(catalog, project));

    assert.equal(decoded.project.answers.bathroom[0].tubPhoto, undefined);
    assert.equal(decoded.project.answers.bathroom[0].tubSize, "60 x 32");
    assert.equal(project.answers.bathroom[0].tubPhoto, photo);
  });
});

describe("generated links", () => {
  test("builds client links from the current application base", () => {
    const link = clientLink({ sections: [] }, { id: "p1", answers: {} });

    assert.match(link, /^https:\/\/example\.test\/specsheet\/#\/client\?d=/);
  });

  test("builds confirmation links carrying the project and picks", () => {
    const link = returnLink(
      { id: "p1" },
      "Kitchen",
      { "kitchen.0.counter": "quartz" },
      [{ where: "Counter", choice: "Quartz" }],
    );
    const encoded = new URL(link).hash.split("?d=")[1];

    assert.deepEqual(decodeShare(encoded), {
      projectId: "p1",
      projectName: "Kitchen",
      picks: { "kitchen.0.counter": "quartz" },
      summary: [{ where: "Counter", choice: "Quartz" }],
    });
  });
});

test("shared payloads never expose the cloud write key", () => {
  const encoded = encodeShare(
    { sections: [] },
    {
      id: "p1",
      answers: {},
      clientPicks: {},
      share: { id: "cloud-id", write_key: "contractor-secret" },
    },
  );

  assert.equal(decodeShare(encoded).project.share, undefined);
});

test("large catalog photos reach the size fallback without throwing", () => {
  const catalog = {
    sections: [{
      id: "finishes",
      questions: [{
        id: "paint",
        options: [{ id: "white", photo: `data:image/jpeg;base64,${"a".repeat(160_000)}` }],
      }],
    }],
  };

  const encoded = encodeShare(catalog, { id: "p1", answers: {}, clientPicks: {} });
  assert.equal(decodeShare(encoded).catalog.sections[0].questions[0].options[0].photo, undefined);
});
