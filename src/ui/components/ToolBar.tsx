import { useEditorStore } from "../../store/editor-store";
import "./ToolBar.css";

const TOOLS = [
  { name: "pen", icon: "P", label: "Pen" },
  { name: "colorpen", icon: "C", label: "Color Pen" },
  { name: "text", icon: "T", label: "Text" },
  { name: "rectangle", icon: "R", label: "Rectangle" },
  { name: "ellipse", icon: "O", label: "Ellipse" },
  { name: "fill", icon: "F", label: "Fill" },
  { name: "eyedropper", icon: "I", label: "Eyedropper" },
  { name: "select", icon: "S", label: "Select" },
  { name: "eraser", icon: "E", label: "Eraser" },
];

export function ToolBar() {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const fillMode = useEditorStore((s) => s.fillMode);
  const setFillMode = useEditorStore((s) => s.setFillMode);

  const currentToolDef = TOOLS.find((t) => t.name === activeTool);
  const showFillToggle =
    activeTool === "rectangle" || activeTool === "ellipse";

  return (
    <div className="toolbar">
      <div className="toolbar-title">Tools</div>
      <div className="toolbar-buttons">
        {TOOLS.map((tool) => (
          <button
            key={tool.name}
            className={`toolbar-btn ${activeTool === tool.name ? "active" : ""}`}
            onClick={() => setActiveTool(tool.name)}
            title={`${tool.label} (${tool.icon})`}
          >
            {tool.icon}
          </button>
        ))}
      </div>
      {showFillToggle && (
        <div className="toolbar-option">
          <label>
            <input
              type="checkbox"
              checked={fillMode}
              onChange={(e) => setFillMode(e.target.checked)}
            />
            Fill
          </label>
        </div>
      )}
      {currentToolDef && (
        <div className="toolbar-current">{currentToolDef.label}</div>
      )}
    </div>
  );
}
