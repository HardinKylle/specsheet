import { useState } from "react";
import { Swatch } from "../components/inputs.jsx";
import { getAnswer, getRoomCount, isVisible, projectMeta, openSelections, resolveAnswer } from "../lib/model.js";
import { clientLink } from "../lib/link.js";

export default function Sheet({ catalog, project, settings = {} }) {
  const [copied, setCopied] = useState(false);
  const meta = projectMeta(catalog, project);
  const open = openSelections(catalog, project).length;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  async function copyLink() {
    await navigator.clipboard.writeText(clientLink(catalog, project));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <main className="sheet-wrap">
      <div className="sheet-actions no-print">
        <div>
          <strong>Selection sheet ready.</strong>{" "}
          {open === 0
            ? "Every item is specified."
            : `${open} item${open === 1 ? "" : "s"} left open — they print with checkboxes for the client.`}
        </div>
        <div className="sheet-buttons">
          <button className="btn btn-ghost" onClick={copyLink}>
            {copied ? "Link copied ✓" : "Copy client link"}
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>

      <article className="sheet">
        <header className="sheet-head">
          <div className="sheet-brand">
            {settings.logo ? <img className="sheet-logo" src={settings.logo} alt="" /> : <span className="tb-mark">SS</span>}
            <div>
              {settings.companyName ? <span className="sheet-company">{settings.companyName}</span> : null}
              <strong>Finish &amp; Fixture Selection Schedule</strong>
              <span>
                {settings.contactLine || "Prepared for client review — mark one option per open item."}
              </span>
            </div>
          </div>
          <table className="sheet-meta">
            <tbody>
              <tr><th>Project</th><td>{meta.projectName}</td></tr>
              <tr><th>Client</th><td>{meta.clientName}</td></tr>
              <tr><th>Site</th><td>{meta.siteAddress}</td></tr>
              <tr><th>Issued</th><td>{today} · Sheet FS-01 · Rev A</td></tr>
            </tbody>
          </table>
        </header>

        {catalog.sections
          .filter((s) => s.id !== "project")
          .map((section) => (
            <SectionSchedule key={section.id} catalog={catalog} section={section} project={project} />
          ))}

        <footer className="sheet-foot">
          <div className="sig">
            <span>Client signature</span>
            <span>Date</span>
          </div>
          <p>
            Selections marked ● are specified by contractor; ◆ were chosen by the client.
            Open items show ○ options — initial one choice per line. Pricing may vary by selection.
          </p>
        </footer>
      </article>
    </main>
  );
}

function SectionSchedule({ catalog, section, project }) {
  const count = getRoomCount(catalog, project, section);
  if (count === 0) return null;

  return (
    <section className="sched">
      <h2 className="sched-title">
        <span>Division {section.division}</span>
        {section.title}
      </h2>
      {Array.from({ length: count }, (_, roomIndex) => (
        <div key={roomIndex} className="sched-room">
          {section.repeatable && (
            <h3 className="sched-room-tag">
              {section.unitLabel || "Unit"} {String(roomIndex + 1).padStart(2, "0")}
            </h3>
          )}
          <table className="sched-table">
            <tbody>
              {section.questions.map((q, qi) =>
                isVisible(q, project, section, roomIndex) ? (
                  <ScheduleRow
                    key={q.id}
                    code={`${section.division}.${String(qi + 1).padStart(2, "0")}`}
                    question={q}
                    value={getAnswer(project, section, roomIndex, q.id)}
                    resolved={resolveAnswer(project, section, roomIndex, q)}
                  />
                ) : null
              )}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  );
}

function ScheduleRow({ code, question, value, resolved }) {
  if (question.type === "image") {
    if (!value) return null;
    return (
      <tr>
        <td className="sched-code">{code}</td>
        <td className="sched-label">{question.label}</td>
        <td className="sched-value">
          <img className="sched-photo" src={value} alt={question.label} />
        </td>
      </tr>
    );
  }

  if (question.type !== "choice") {
    return (
      <tr>
        <td className="sched-code">{code}</td>
        <td className="sched-label">{question.label}</td>
        <td className="sched-value">
          {value ?? <span className="sched-blank">___________________</span>}
        </td>
      </tr>
    );
  }

  const chosen = question.options.find((o) => o.id === resolved?.value);
  const byClient = resolved?.by === "client";
  return (
    <tr className={chosen ? "" : "sched-open"}>
      <td className="sched-code">{code}</td>
      <td className="sched-label">
        {question.label}
        {!chosen && <span className="sched-flag">client to select</span>}
      </td>
      <td className="sched-value">
        {chosen ? (
          <span className={`sched-pick${byClient ? " sched-pick-client" : ""}`}>
            {chosen.photo ? <img className="sched-opt-photo" src={chosen.photo} alt="" /> : <Swatch swatch={chosen.swatch} size="sm" />}
            <b>{byClient ? "◆" : "●"} {chosen.label}</b>
            <em>{byClient ? "client selected" : "specified"}</em>
          </span>
        ) : (
          <span className="sched-options">
            {question.options.map((o) => (
              <span key={o.id} className="sched-opt">
                {o.photo ? <img className="sched-opt-photo" src={o.photo} alt="" /> : <Swatch swatch={o.swatch} size="sm" />}○ {o.label}
              </span>
            ))}
          </span>
        )}
      </td>
    </tr>
  );
}
