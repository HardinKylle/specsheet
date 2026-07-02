import { useMemo, useState } from "react";
import { ChoiceGrid } from "../components/inputs.jsx";
import { openSelections, optionLabel, projectMeta } from "../lib/model.js";
import { decodeShare } from "../lib/link.js";

export default function Client({ params }) {
  const payload = useMemo(() => decodeShare(params.get("d") || ""), [params]);
  const [picks, setPicks] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!payload) {
    return (
      <main className="client-wrap">
        <p className="empty-note">
          This selection link is invalid or incomplete. Ask your contractor to send a fresh one.
        </p>
      </main>
    );
  }

  const { catalog, project } = payload;
  const meta = projectMeta(catalog, project);
  const open = openSelections(catalog, project);
  const remaining = open.filter((item) => !picks[keyOf(item)]).length;

  function keyOf({ section, roomIndex, question }) {
    return `${section.id}.${roomIndex}.${question.id}`;
  }

  if (open.length === 0) {
    return (
      <main className="client-wrap">
        <p className="empty-note">Every selection for {meta.projectName} is already specified — nothing to choose. 🎉</p>
      </main>
    );
  }

  if (submitted) {
    return (
      <main className="client-wrap">
        <div className="client-done">
          <h1>Selections recorded</h1>
          <p>Here's what you chose for <b>{meta.projectName}</b>:</p>
          <ul>
            {open.map((item) => (
              <li key={keyOf(item)}>
                <span className="done-where">
                  {item.section.repeatable
                    ? `${item.section.unitLabel || "Unit"} ${item.roomIndex + 1} — `
                    : ""}
                  {item.question.label}
                </span>
                <b>{optionLabel(item.question, picks[keyOf(item)]) || "Skipped"}</b>
              </li>
            ))}
          </ul>
          <a
            className="btn btn-primary"
            href={`mailto:?subject=${encodeURIComponent(`Selections — ${meta.projectName}`)}&body=${encodeURIComponent(
              open
                .map(
                  (item) =>
                    `${item.section.title}${item.section.repeatable ? ` ${item.roomIndex + 1}` : ""} — ${item.question.label}: ${optionLabel(item.question, picks[keyOf(item)]) || "Skipped"}`
                )
                .join("\n")
            )}`}
          >
            Email selections to contractor
          </a>
          <p className="client-note">
            In the full build this submits automatically — no email step needed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="client-wrap">
      <div className="client-intro">
        <h1>Choose your finishes</h1>
        <p>
          Your contractor specified the project details for <b>{meta.projectName}</b>. These{" "}
          {open.length} selections are yours to make — tap one option per item.
        </p>
      </div>

      {open.map((item) => (
        <div key={keyOf(item)} className="client-item">
          <label className="field-label">
            <span className="field-code">
              {item.section.repeatable
                ? `${item.section.unitLabel || "Unit"} ${String(item.roomIndex + 1).padStart(2, "0")}`
                : item.section.title}
            </span>
            {item.question.label}
          </label>
          <ChoiceGrid
            question={item.question}
            value={picks[keyOf(item)]}
            onChange={(v) => setPicks({ ...picks, [keyOf(item)]: v })}
          />
        </div>
      ))}

      <div className="client-submit">
        <button className="btn btn-primary" onClick={() => setSubmitted(true)} disabled={remaining === open.length}>
          Confirm selections
        </button>
        <span className="client-note">
          {remaining === 0 ? "All items chosen." : `${remaining} item${remaining === 1 ? "" : "s"} left.`}
        </span>
      </div>
    </main>
  );
}
