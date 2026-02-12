import { AnsiColor, PALETTES, type PaletteName } from "../../domain/cell";
import { useEditorStore } from "../../store/editor-store";
import "./ColorPalette.css";

const COLORS: AnsiColor[] = [
  AnsiColor.Black,
  AnsiColor.Red,
  AnsiColor.Green,
  AnsiColor.Yellow,
  AnsiColor.Blue,
  AnsiColor.Magenta,
  AnsiColor.Cyan,
  AnsiColor.White,
];

const COLOR_NAMES: Record<AnsiColor, string> = {
  [AnsiColor.Black]: "Black",
  [AnsiColor.Red]: "Red",
  [AnsiColor.Green]: "Green",
  [AnsiColor.Yellow]: "Yellow",
  [AnsiColor.Blue]: "Blue",
  [AnsiColor.Magenta]: "Magenta",
  [AnsiColor.Cyan]: "Cyan",
  [AnsiColor.White]: "White",
};

const PALETTE_NAMES: PaletteName[] = ["ansi", "c64"];

export function ColorPalette() {
  const currentFg = useEditorStore((s) => s.currentFg);
  const currentBg = useEditorStore((s) => s.currentBg);
  const currentChar = useEditorStore((s) => s.currentChar);
  const palette = useEditorStore((s) => s.palette);
  const paletteName = useEditorStore((s) => s.paletteName);
  const setCurrentFg = useEditorStore((s) => s.setCurrentFg);
  const setCurrentBg = useEditorStore((s) => s.setCurrentBg);
  const setPalette = useEditorStore((s) => s.setPalette);

  return (
    <div className="color-palette">
      <div className="palette-section">
        <div className="palette-label">Palette</div>
        <div className="palette-switcher">
          {PALETTE_NAMES.map((name) => (
            <button
              key={name}
              className={`palette-btn ${paletteName === name ? "active" : ""}`}
              onClick={() => setPalette(name)}
            >
              {PALETTES[name].label}
            </button>
          ))}
        </div>
      </div>
      <div className="palette-section">
        <div className="palette-label">FG</div>
        <div className="color-grid">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`color-swatch ${currentFg === color ? "selected-fg" : ""}`}
              style={{ backgroundColor: palette.css[color] }}
              onClick={() => setCurrentFg(color)}
              title={COLOR_NAMES[color]}
            />
          ))}
        </div>
      </div>
      <div className="palette-section">
        <div className="palette-label">BG</div>
        <div className="color-grid">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`color-swatch ${currentBg === color ? "selected-bg" : ""}`}
              style={{ backgroundColor: palette.css[color] }}
              onClick={() => setCurrentBg(color)}
              title={COLOR_NAMES[color]}
            />
          ))}
        </div>
      </div>
      <div className="color-preview">
        <div
          className="color-preview-box"
          style={{
            backgroundColor: palette.css[currentBg],
            color: palette.css[currentFg],
          }}
        >
          {String.fromCodePoint(currentChar)}
        </div>
      </div>
    </div>
  );
}
