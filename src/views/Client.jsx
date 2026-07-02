import { useEffect, useState } from "react";
import { ChoiceGrid } from "../components/inputs.jsx";
import { openSelections, optionLabel, projectMeta } from "../lib/model.js";
import { decodeShare, returnLink } from "../lib/link.js";
import { getProject, submitSelections } from "../lib/cloud.js";

export default function Client({ params, onLoaded }) {
  const cloudId = params.get("id");
  const [payload, setPayload] = useState(() => (cloudId ? null : decodeShare(params.get("d") || "")));
  const [loading, setLoading] = useState(Boolean(cloudId));
  const [picks, setPicks] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!cloudId) return;
    getProject(cloudId)
      .then((p) => {
        const loaded = p ? { catalog: p.catalog, project: p.data } : null;
        setPayload(loaded);
        if (loaded) onLoaded?.(loaded); // lets the app header show this project
      })
      .catch(() => setPayload(null))
      .finally(() => setLoading(false));
  }, [cloudId]);

  if (loading) {
    return (
      <main className="client-wrap">
        <p className="empty-note">Loading your selections…</p>
      </main>
    );
  }

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

  const chosen = open.filter((item) => picks[keyOf(item)]);
  const summary = chosen.map((item) => ({
    where: `${item.section.repeatable ? `${item.section.unitLabel || "Unit"} ${item.roomIndex + 1} — ` : ""}${item.question.label}`,
    choice: optionLabel(item.question, picks[keyOf(item)]),
  }));
  const cleanPicks = Object.fromEntries(chosen.map((item) => [keyOf(item), picks[keyOf(item)]]));

  async function confirm() {
    if (!cloudId) {
      setSubmitted(true);
      return;
    }
    setSending(true);
    setError(null);
    try {
      await submitSelections(cloudId, cleanPicks, summary);
      setSubmitted(true);
    } catch {
      setError("Couldn't send your selections — check your connection and try again.");
    } finally {
      setSending(false);
    }
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
          <h1>{cloudId ? "Selections sent" : "Selections recorded"}</h1>
          <p>Here's what you chose for <b>{meta.projectName}</b>:</p>
          <ul>
            {summary.map((line, i) => (
              <li key={i}>
                <span className="done-where">{line.where}</span>
                <b>{line.choice}</b>
              </li>
            ))}
          </ul>
          {cloudId ? (
            <p className="client-note">
              All set — your contractor can see these selections in the project now.
              You can close this page.
            </p>
          ) : (
            <OfflineReturn project={project} meta={meta} cleanPicks={cleanPicks} summary={summary} copied={copied} setCopied={setCopied} />
          )}
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
        <button
          className="btn btn-primary"
          onClick={confirm}
          disabled={sending || remaining === open.length}
        >
          {sending ? "Sending…" : "Confirm selections"}
        </button>
        <span className="client-note">
          {error || (remaining === 0 ? "All items chosen." : `${remaining} item${remaining === 1 ? "" : "s"} left.`)}
        </span>
      </div>
    </main>
  );
}

function OfflineReturn({ project, meta, cleanPicks, summary, copied, setCopied }) {
  const link = returnLink(project, meta.projectName, cleanPicks, summary);
  return (
    <>
      <div className="client-return">
        <a
          className="btn btn-primary"
          href={`mailto:?subject=${encodeURIComponent(`Selections — ${meta.projectName}`)}&body=${encodeURIComponent(
            `Hi,\n\nI made my selections for ${meta.projectName}. Open this link to load them into the project:\n\n${link}\n\nThanks!`
          )}`}
        >
          Email selections to contractor
        </a>
        <button
          className="btn btn-ghost"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }}
        >
          {copied ? "Link copied ✓" : "Copy confirmation link"}
        </button>
      </div>
      <p className="client-note">
        The link carries your choices — when your contractor opens it, they land
        directly in the project.
      </p>
    </>
  );
}
