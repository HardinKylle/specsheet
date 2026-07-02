// Seeded once on first run so new visitors land on a living dashboard instead
// of an empty one. Includes contractor-specified answers, open items, and two
// client picks so every state of the workflow is visible immediately.

export function makeSampleProject() {
  const started = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  return {
    id: `p_sample_${Date.now().toString(36)}`,
    createdAt: started.toISOString(),
    clientPicks: {
      "bathroom.0.vanityStyle": "shaker",
      "finishes.0.wallPaint": "seasalt",
    },
    answers: {
      project: {
        projectName: "Sample — Alder St Residence",
        clientName: "Jane & John Doe",
        siteAddress: "123 Oak St, Springfield",
        bathroomCount: 2,
      },
      bathroom: [
        { bathFloor: "tile", vanitySize: "v60", wetArea: "combo", tubSize: '60" x 32" alcove' },
        { wetArea: "shower", vanitySize: "v36", bathFloor: "lvp" },
      ],
      kitchen: { cabinetStyle: "shaker", hardwareFinish: "black" },
      finishes: { mainFloor: "hardwood", trimPaint: "purewhite", doorStyle: "twopanel" },
    },
  };
}
