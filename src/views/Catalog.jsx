import { useState } from "react";
import { Swatch } from "../components/inputs.jsx";
import { saveCatalog, resetCatalog, saveSettings, credsToCode } from "../lib/store.js";
import { compressImage } from "../lib/images.js";

let uid = 0;
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}_${uid++}`;

export default function Catalog({ catalog, setCatalog, settings, setSettings, workspace, connectWorkspace }) {
  const [activeId, setActiveId] = useState(catalog.sections[0].id);
  const isBusiness = activeId === "business";
  const active = catalog.sections.find((s) => s.id === activeId) || catalog.sections[0];

  function updateSettings(next) {
    setSettings(next);
    saveSettings(next);
  }

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
            className={`toc-item${!isBusiness && s.id === active.id ? " active" : ""}`}
            onClick={() => setActiveId(s.id)}
          >
            <span className="toc-div">DIV {s.division}</span>
            <span>{s.title}</span>
          </button>
        ))}
        <button
          className={`toc-item${isBusiness ? " active" : ""}`}
          onClick={() => setActiveId("business")}
        >
          <span className="toc-div">CO</span>
          <span>Your business</span>
        </button>
        <div className="toc-actions">
          <p className="toc-note">
            Edits here change the intake form and every future sheet. No developer required.
          </p>
          <button className="btn btn-ghost" onClick={handleReset}>Reset to defaults</button>
        </div>
      </aside>

      <main className="pane">
        {isBusiness ? (
          <BusinessPanel
            settings={settings}
            updateSettings={updateSettings}
            workspace={workspace}
            connectWorkspace={connectWorkspace}
          />
        ) : (
          <SectionEditor active={active} updateSection={updateSection} />
        )}
      </main>
    </div>
  );
}

function BusinessPanel({ settings, updateSettings, workspace, connectWorkspace }) {
  const [codeInput, setCodeInput] = useState("");
  const [syncMsg, setSyncMsg] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleConnect() {
    const error = await connectWorkspace(codeInput);
    setSyncMsg(error || "Connected — your projects are loaded on this device.");
    if (!error) setCodeInput("");
  }

  async function handleLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    updateSettings({ ...settings, logo: await compressImage(file, 240, 0.8) });
  }

  return (
    <>
      <div className="pane-head">
        <span className="pane-div">Company</span>
        <h1>Your Business</h1>
        <p className="pane-hint">
          Shown in the app header and printed on every selection sheet you generate.
        </p>
      </div>

      <div className="field">
        <label className="field-label">Company name</label>
        <input
          className="field-input"
          value={settings.companyName || ""}
          placeholder="Summit Builders LLC"
          onChange={(e) => updateSettings({ ...settings, companyName: e.target.value })}
        />
      </div>

      <div className="field">
        <label className="field-label">Contact line</label>
        <input
          className="field-input"
          value={settings.contactLine || ""}
          placeholder="(555) 210-4488 · office@summitbuilders.com"
          onChange={(e) => updateSettings({ ...settings, contactLine: e.target.value })}
        />
      </div>

      <div className="field">
        <label className="field-label">Logo</label>
        {settings.logo ? (
          <div className="image-preview">
            <img src={settings.logo} alt="Company logo" />
            <button className="btn btn-ghost" onClick={() => updateSettings({ ...settings, logo: undefined })}>
              Remove logo
            </button>
          </div>
        ) : (
          <label className="image-drop">
            <input type="file" accept="image/*" onChange={handleLogo} />
            <span>Upload logo</span>
            <small>Square or wide marks both work — it's scaled to fit.</small>
          </label>
        )}
      </div>

      <div className="field sync-panel">
        <label className="field-label">Device sync</label>
        <p className="pane-hint">
          Your projects are saved to the cloud under this sync code. Keep a copy
          somewhere safe — enter it on another device (or after clearing this
          browser) to load the same projects.
        </p>
        {workspace ? (
          <div className="sync-code-row">
            <code className="sync-code">{credsToCode(workspace)}</code>
            <button
              className="btn btn-ghost btn-small"
              onClick={async () => {
                await navigator.clipboard.writeText(credsToCode(workspace));
                setCopied(true);
                setTimeout(() => setCopied(false), 2500);
              }}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        ) : (
          <p className="pane-hint">Connecting to the cloud…</p>
        )}
        <div className="sync-connect">
          <input
            className="field-input"
            placeholder="Paste a sync code from another device"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
          />
          <button className="btn btn-ghost" onClick={handleConnect} disabled={!codeInput.trim()}>
            Connect
          </button>
        </div>
        {syncMsg ? <p className="pane-hint"><b>{syncMsg}</b></p> : null}
      </div>
    </>
  );
}

function SectionEditor({ active, updateSection }) {
  return (
    <>
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
                    {opt.photo ? <img className="cat-photo-thumb" src={opt.photo} alt="" /> : null}
                    <label className="btn btn-ghost btn-small cat-photo-btn">
                      {opt.photo ? "Replace photo" : "+ Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const photo = await compressImage(file, 240, 0.7);
                          updateSection(active.id, (s) => {
                            s.questions[qi].options[oi].photo = photo;
                            return s;
                          });
                        }}
                      />
                    </label>
                    {opt.photo ? (
                      <button
                        className="btn btn-ghost btn-small"
                        title="Remove photo"
                        onClick={() =>
                          updateSection(active.id, (s) => {
                            delete s.questions[qi].options[oi].photo;
                            return s;
                          })
                        }
                      >
                        No photo
                      </button>
                    ) : null}
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
    </>
  );
}
