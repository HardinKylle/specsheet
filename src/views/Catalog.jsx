import { useState } from "react";
import { Swatch } from "../components/inputs.jsx";
import { saveCatalog, resetCatalog } from "../lib/store.js";

let uid = 0;
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}_${uid++}`;

export default function Catalog({ catalog, setCatalog }) {
  const [activeId, setActiveId] = useState(catalog.sections[0].id);
  const active = catalog.sections.find((s) => s.id === activeId) || catalog.sections[0];

  function update(next) {
    setCatalog(next);
    saveCatalog(next);
  }

  function updateSection(sectionId, mutate) {
    update({
      ...catalog,
      sections: catalog.sections.map((s) => (s.id === sectionId ? mutate(structuredClone(s)) : s)),
    });
  }

  function handleReset() {
    if (confirm("Restore the default catalog? Your edits will be lost.")) {
      setCatalog(resetCatalog());
    }
  }

  return (
    <div className="layout">
      <aside className="toc">
        <p className="toc-title">Catalog</p>
        {catalog.sections.map((s) => (
          <button
            key={s.id}
            className={`toc-item${s.id === active.id ? " active" : ""}`}
            onClick={() => setActiveId(s.id)}
          >
            <span className="toc-div">DIV {s.division}</span>
            <span>{s.title}</span>
          </button>
        ))}
        <div className="toc-actions">
          <p className="toc-note">
            Edits here change the intake form and every future sheet. No developer required.
          </p>
          <button className="btn btn-ghost" onClick={handleReset}>Reset to defaults</button>
        </div>
      </aside>

      <main className="pane">
        <div className="pane-head">
          <span className="pane-div">Division {active.division}</span>
          <h1>Edit — {active.title}</h1>
          <p className="pane-hint">
            Rename questions, adjust the options clients can pick, or add new ones.
            Swatches accept any CSS color or gradient.
          </p>
        </div>

        {active.questions.map((q, qi) => (
          <div key={q.id} className="cat-question">
            <div className="cat-qhead">
              <span className="field-code">
                {active.division}.{String(qi + 1).padStart(2, "0")}
              </span>
              <input
                className="field-input cat-qlabel"
                value={q.label}
                onChange={(e) =>
                  updateSection(active.id, (s) => {
                    s.questions[qi].label = e.target.value;
                    return s;
                  })
                }
              />
              <span className="cat-type">{q.type}</span>
              <button
                className="btn btn-ghost btn-small"
                onClick={() =>
                  confirm(`Remove "${q.label}"?`) &&
                  updateSection(active.id, (s) => {
                    s.questions.splice(qi, 1);
                    return s;
                  })
                }
              >
                Remove
              </button>
            </div>

            {q.type === "choice" && (
              <div className="cat-options">
                {q.options.map((opt, oi) => (
                  <div key={opt.id} className="cat-option">
                    <Swatch swatch={opt.swatch} size="sm" />
                    <input
                      className="field-input"
                      value={opt.label}
                      onChange={(e) =>
                        updateSection(active.id, (s) => {
                          s.questions[qi].options[oi].label = e.target.value;
                          return s;
                        })
                      }
                    />
                    <input
                      className="field-input cat-swatch-input"
                      placeholder="swatch (CSS color)"
                      value={opt.swatch || ""}
                      onChange={(e) =>
                        updateSection(active.id, (s) => {
                          s.questions[qi].options[oi].swatch = e.target.value || undefined;
                          return s;
                        })
                      }
                    />
                    <button
                      className="btn btn-ghost btn-small"
                      onClick={() =>
                        updateSection(active.id, (s) => {
                          s.questions[qi].options.splice(oi, 1);
                          return s;
                        })
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  className="btn btn-ghost btn-small"
                  onClick={() =>
                    updateSection(active.id, (s) => {
                      s.questions[qi].options.push({ id: newId("opt"), label: "New option" });
                      return s;
                    })
                  }
                >
                  + Add option
                </button>
              </div>
            )}
          </div>
        ))}

        <div className="cat-add">
          <button
            className="btn btn-primary"
            onClick={() =>
              updateSection(active.id, (s) => {
                s.questions.push({
                  id: newId("q"),
                  type: "choice",
                  label: "New question",
                  options: [
                    { id: newId("opt"), label: "Option A" },
                    { id: newId("opt"), label: "Option B" },
                  ],
                });
                return s;
              })
            }
          >
            + Add choice question
          </button>
          <button
            className="btn btn-ghost"
            onClick={() =>
              updateSection(active.id, (s) => {
                s.questions.push({ id: newId("q"), type: "text", label: "New text question" });
                return s;
              })
            }
          >
            + Add text question
          </button>
        </div>
      </main>
    </div>
  );
}
