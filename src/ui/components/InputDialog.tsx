import { useState, useRef, useEffect } from "react";
import "./InputDialog.css";

export interface InputDialogField {
  label: string;
  defaultValue: string;
}

interface InputDialogProps {
  title: string;
  fields: InputDialogField[];
  onOk: (values: string[]) => void;
  onCancel: () => void;
}

export function InputDialog({ title, fields, onOk, onCancel }: InputDialogProps) {
  const [values, setValues] = useState(() => fields.map((f) => f.defaultValue));
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    firstInputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOk(values);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <div className="dialog-overlay" onMouseDown={onCancel}>
      <div
        className="dialog-box"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="dialog-title">{title}</div>
        <form onSubmit={handleSubmit}>
          <div className="dialog-fields">
            {fields.map((field, i) => (
              <label key={i} className="dialog-field">
                <span className="dialog-label">{field.label}</span>
                <input
                  ref={i === 0 ? firstInputRef : undefined}
                  type="number"
                  min="1"
                  max="999"
                  className="dialog-input"
                  value={values[i]}
                  onChange={(e) => {
                    const next = [...values];
                    next[i] = e.target.value;
                    setValues(next);
                  }}
                />
              </label>
            ))}
          </div>
          <div className="dialog-buttons">
            <button type="button" className="dialog-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="dialog-btn dialog-btn-primary">
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
