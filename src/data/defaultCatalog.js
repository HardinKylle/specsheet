// Default catalog: sections follow CSI MasterFormat division numbers so the
// generated schedule reads like a real construction document. Everything here
// is editable in the Catalog view and persisted to localStorage.

export const DEFAULT_CATALOG = {
  sections: [
    {
      id: "project",
      division: "01",
      title: "Project Information",
      repeatable: false,
      questions: [
        { id: "projectName", type: "text", label: "Project name", placeholder: "Alder St Residence — Master Remodel" },
        { id: "clientName", type: "text", label: "Client name", placeholder: "Jane & John Doe" },
        { id: "siteAddress", type: "text", label: "Site address", placeholder: "123 Oak St, Springfield" },
        { id: "bathroomCount", type: "number", label: "Number of bathrooms", min: 0, max: 6 },
      ],
    },
    {
      id: "bathroom",
      division: "22",
      title: "Bathrooms",
      repeatable: true,
      countFrom: "bathroomCount",
      unitLabel: "Bath",
      questions: [
        {
          id: "bathFloor",
          type: "choice",
          label: "Flooring type",
          options: [
            { id: "tile", label: "Tile", swatch: "linear-gradient(135deg,#8fa3ad 0 48%,#f2f0eb 48% 52%,#7e929c 52%)" },
            { id: "hardwood", label: "Hardwood", swatch: "repeating-linear-gradient(90deg,#8a5a33 0 14px,#9c6a3e 14px 28px,#7c4f2c 28px 42px)" },
            { id: "lvp", label: "LVP", swatch: "repeating-linear-gradient(90deg,#a98963 0 18px,#b79571 18px 36px)" },
            { id: "laminate", label: "Laminate", swatch: "repeating-linear-gradient(90deg,#c2a175 0 16px,#cdad82 16px 32px)" },
          ],
        },
        {
          id: "vanitySize",
          type: "choice",
          label: "Vanity size",
          options: [
            { id: "v24", label: "24\" single" },
            { id: "v36", label: "36\" single" },
            { id: "v48", label: "48\" single" },
            { id: "v60", label: "60\" double" },
          ],
        },
        {
          id: "vanityStyle",
          type: "choice",
          label: "Vanity style",
          options: [
            { id: "shaker", label: "Shaker", swatch: "#e9e6df" },
            { id: "flat", label: "Flat panel", swatch: "#cfd4d8" },
            { id: "raised", label: "Raised panel", swatch: "#d9cbb4" },
            { id: "floating", label: "Floating", swatch: "#b9a58c" },
          ],
        },
        {
          id: "wetArea",
          type: "choice",
          label: "Tub, shower, or none",
          options: [
            { id: "tub", label: "Tub" },
            { id: "shower", label: "Shower" },
            { id: "combo", label: "Tub + shower" },
            { id: "none", label: "None" },
          ],
        },
        {
          id: "tubSize",
          type: "text",
          label: "Tub size",
          placeholder: "60\" x 32\" alcove",
          showIf: { question: "wetArea", values: ["tub", "combo"] },
        },
        {
          id: "tubPhoto",
          type: "image",
          label: "Tub reference photo",
          hint: "Upload a photo of the specified tub — it prints on the schedule.",
          showIf: { question: "wetArea", values: ["tub", "combo"] },
        },
        {
          id: "fixtureFinish",
          type: "choice",
          label: "Plumbing fixture finish",
          options: [
            { id: "chrome", label: "Chrome", swatch: "linear-gradient(135deg,#e8eaec,#aab1b7 55%,#dfe2e5)" },
            { id: "nickel", label: "Brushed nickel", swatch: "linear-gradient(135deg,#c9c6bd,#a5a29a 55%,#c2bfb6)" },
            { id: "black", label: "Matte black", swatch: "#2b2d2f" },
            { id: "brass", label: "Brushed brass", swatch: "linear-gradient(135deg,#d3b167,#b08e46 55%,#caa95f)" },
          ],
        },
      ],
    },
    {
      id: "kitchen",
      division: "12",
      title: "Kitchen",
      repeatable: false,
      questions: [
        {
          id: "cabinetStyle",
          type: "choice",
          label: "Cabinet door style",
          options: [
            { id: "shaker", label: "Shaker", swatch: "#eef0f2" },
            { id: "flat", label: "Flat panel", swatch: "#3f4a52" },
            { id: "inset", label: "Inset", swatch: "#dcd7ce" },
          ],
        },
        {
          id: "counterMaterial",
          type: "choice",
          label: "Countertop material",
          options: [
            { id: "quartz", label: "Quartz", swatch: "linear-gradient(120deg,#f4f2ee 60%,#e4e0d8 60.5%,#f4f2ee 63%)" },
            { id: "granite", label: "Granite", swatch: "radial-gradient(circle at 30% 40%,#5d5a55 8%,#4a4844 30%,#605c56 60%,#43413d)" },
            { id: "butcher", label: "Butcher block", swatch: "repeating-linear-gradient(90deg,#b3854f 0 12px,#c2955e 12px 24px)" },
            { id: "marble", label: "Marble", swatch: "linear-gradient(115deg,#f6f5f2 55%,#d9d7d2 56%,#f6f5f2 60%,#e3e1dc 78%,#f6f5f2 80%)" },
          ],
        },
        {
          id: "hardwareFinish",
          type: "choice",
          label: "Cabinet hardware finish",
          options: [
            { id: "black", label: "Matte black", swatch: "#2b2d2f" },
            { id: "nickel", label: "Brushed nickel", swatch: "linear-gradient(135deg,#c9c6bd,#a5a29a 55%,#c2bfb6)" },
            { id: "brass", label: "Brushed brass", swatch: "linear-gradient(135deg,#d3b167,#b08e46 55%,#caa95f)" },
          ],
        },
        {
          id: "backsplash",
          type: "choice",
          label: "Backsplash",
          options: [
            { id: "subway", label: "Subway tile", swatch: "repeating-linear-gradient(0deg,#f0efec 0 10px,#d8d6d0 10px 11px)" },
            { id: "herringbone", label: "Herringbone", swatch: "repeating-linear-gradient(45deg,#e8e6e1 0 8px,#d3d1cb 8px 9px)" },
            { id: "slab", label: "Full slab", swatch: "#eceae5" },
            { id: "none", label: "None" },
          ],
        },
      ],
    },
    {
      id: "finishes",
      division: "09",
      title: "Whole-Home Finishes",
      repeatable: false,
      questions: [
        {
          id: "mainFloor",
          type: "choice",
          label: "Main living flooring",
          options: [
            { id: "hardwood", label: "Hardwood", swatch: "repeating-linear-gradient(90deg,#8a5a33 0 14px,#9c6a3e 14px 28px,#7c4f2c 28px 42px)" },
            { id: "lvp", label: "LVP", swatch: "repeating-linear-gradient(90deg,#a98963 0 18px,#b79571 18px 36px)" },
            { id: "carpet", label: "Carpet", swatch: "#b9b4a8" },
            { id: "tile", label: "Tile", swatch: "linear-gradient(135deg,#8fa3ad 0 48%,#f2f0eb 48% 52%,#7e929c 52%)" },
          ],
        },
        {
          id: "wallPaint",
          type: "choice",
          label: "Wall paint color",
          options: [
            { id: "alabaster", label: "Alabaster", swatch: "#edeae0" },
            { id: "agreeable", label: "Agreeable Gray", swatch: "#d1cbc0" },
            { id: "seasalt", label: "Sea Salt", swatch: "#cdd5cd" },
            { id: "iron", label: "Iron Ore", swatch: "#434447" },
          ],
        },
        {
          id: "trimPaint",
          type: "choice",
          label: "Trim color",
          options: [
            { id: "purewhite", label: "Pure White", swatch: "#f2f1ec" },
            { id: "match", label: "Match walls" },
            { id: "black", label: "Black accent", swatch: "#2b2d2f" },
          ],
        },
        {
          id: "doorStyle",
          type: "choice",
          label: "Interior door style",
          options: [
            { id: "twopanel", label: "2-panel shaker" },
            { id: "fivepanel", label: "5-panel" },
            { id: "flush", label: "Flush modern" },
          ],
        },
      ],
    },
  ],
};
