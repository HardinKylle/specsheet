import { useState } from "react";
import { QuestionField } from "../components/inputs.jsx";
import { getAnswer, setAnswer, getRoomCount, isVisible, openSelections } from "../lib/model.js";
import { clearProject } from "../lib/store.js";

export default function Intake({ catalog, project, setProject }) {
  const [activeId, setActiveId] = useState(catalog.sections[0].id);
  const active = catalog.sections.find((s) => s.id === activeId) || catalog.sections[0];
  const open = openSelections(catalog, project).length;

  function startOver() {
    if (confirm("Clear all answers and start a new project?")) setProject(clearProject());
  }

  return (
    <div className="layout">
      <aside className="toc">
        <p className="toc-title">Spec book</p>
        {catalog.sections.map((s) => {
          const count = getRoomCount(catalog, project, s);
          return (
            <button
              key={s.id}
              className={`toc-item${s.id === active.id ? " active" : ""}`}
              onClick={() => setActiveId(s.id)}
            >
              <span className="toc-div">DIV {s.division}</span>
              <span>{s.title}</span>
              {s.repeatable ? <span className="toc-count">{count}</span> : null}
            </button>
          );
        })}
        <div className="toc-actions">
          <a className="btn btn-primary" href="#/sheet">Generate selection sheet</a>
          <p className="toc-note">
            {open === 0
              ? "All selections specified."
              : `${open} selection${open === 1 ? "" : "s"} left open for the client.`}
          </p>
          <button className="btn btn-ghost" onClick={startOver}>New project</button>
        </div>
      </aside>

      <main className="pane">
        <div className="pane-head">
          <span className="pane-div">Division {active.division}</span>
          <h1>{active.title}</h1>
          <p className="pane-hint">
            Answer what's already decided. Anything left blank becomes a choice the
            client makes — on paper or through their link.
          </p>
        </div>
        <SectionForm catalog={catalog} section={active} project={project} setProject={setProject} />
      </main>
    </div>
  );
}

function SectionForm({ catalog, section, project, setProject }) {
  const count = getRoomCount(catalog, project, section);

  if (section.repeatable && count === 0) {
    return (
      <p className="empty-note">
        Set “Number of bathrooms” under Division 01 to add {section.title.toLowerCase()} here.
      </p>
    );
  }

  return (
    <>
      {Array.from({ length: count }, (_, roomIndex) => (
        <fieldset key={roomIndex} className="room">
          {section.repeatable && (
            <legend className="room-tag">
              {section.unitLabel || "Unit"} {String(roomIndex + 1).padStart(2, "0")}
            </legend>
          )}
          {section.questions.map((q) =>
            isVisible(q, project, section, roomIndex) ? (
              <div key={q.id} className="field">
                <label className="field-label">
                  <span className="field-code">
                    {section.division}.{String(section.questions.indexOf(q) + 1).padStart(2, "0")}
                  </span>
                  {q.label}
                </label>
                <QuestionField
                  question={q}
                  value={getAnswer(project, section, roomIndex, q.id)}
                  onChange={(v) => setProject(setAnswer(project, section, roomIndex, q.id, v))}
                />
              </div>
            ) : null
          )}
        </fieldset>
      ))}
    </>
  );
}
