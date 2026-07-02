import { compressImage } from "../lib/images.js";

export function Swatch({ swatch, size = "md" }) {
  if (!swatch) return null;
  return <span className={`swatch swatch-${size}`} style={{ background: swatch }} aria-hidden="true" />;
}

export function ChoiceGrid({ question, value, onChange, allowClear = true }) {
  return (
    <div className="choice-grid" role="radiogroup" aria-label={question.label}>
      {question.options.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`choice${selected ? " choice-selected" : ""}`}
            onClick={() => onChange(selected && allowClear ? undefined : opt.id)}
          >
            <Swatch swatch={opt.swatch} />
            <span className="choice-label">{opt.label}</span>
            <span className="choice-mark">{selected ? "●" : "○"}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TextField({ question, value, onChange }) {
  return (
    <input
      className="field-input"
      type="text"
      value={value ?? ""}
      placeholder={question.placeholder || ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function NumberField({ question, value, onChange }) {
  return (
    <input
      className="field-input field-number"
      type="number"
      min={question.min ?? 0}
      max={question.max ?? 99}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
    />
  );
}

export function ImageField({ question, value, onChange }) {
  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(await compressImage(file));
  }
  return (
    <div className="image-field">
      {value ? (
        <div className="image-preview">
          <img src={value} alt={question.label} />
          <button type="button" className="btn btn-ghost" onClick={() => onChange(undefined)}>
            Remove photo
          </button>
        </div>
      ) : (
        <label className="image-drop">
          <input type="file" accept="image/*" onChange={handleFile} />
          <span>Upload photo</span>
          {question.hint ? <small>{question.hint}</small> : null}
        </label>
      )}
    </div>
  );
}

export function QuestionField({ question, value, onChange }) {
  switch (question.type) {
    case "choice":
      return <ChoiceGrid question={question} value={value} onChange={onChange} />;
    case "number":
      return <NumberField question={question} value={value} onChange={onChange} />;
    case "image":
      return <ImageField question={question} value={value} onChange={onChange} />;
    default:
      return <TextField question={question} value={value} onChange={onChange} />;
  }
}
