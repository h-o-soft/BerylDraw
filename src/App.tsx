import "./App.css";
import { MainCanvas } from "./ui/components/MainCanvas";
import { MenuBar } from "./ui/components/MenuBar";
import { ToolBar } from "./ui/components/ToolBar";
import { ColorPalette } from "./ui/components/ColorPalette";
import { CharacterPalette } from "./ui/components/CharacterPalette";
import { useEditorStore } from "./store/editor-store";

function App() {
  const cursorPos = useEditorStore((s) => s.cursorPos);
  const activeTool = useEditorStore((s) => s.activeTool);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const doc = useEditorStore((s) => s.document);
  const currentChar = useEditorStore((s) => s.currentChar);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);

  const charDisplay = String.fromCodePoint(currentChar);

  return (
    <div className="app">
      <MenuBar />
      <div className="app-toolbar-row">
        <div className="toolbar-row-controls">
          <button
            className="header-btn"
            onClick={toggleGrid}
            title="Toggle Grid"
          >
            Grid: {showGrid ? "ON" : "OFF"}
          </button>
          <button
            className="header-btn"
            onClick={() => setZoom(zoom - 1)}
            disabled={zoom <= 1}
            title="Zoom Out"
          >
            -
          </button>
          <span className="header-zoom">{zoom * 100}%</span>
          <button
            className="header-btn"
            onClick={() => setZoom(zoom + 1)}
            disabled={zoom >= 8}
            title="Zoom In"
          >
            +
          </button>
        </div>
      </div>
      <div className="app-body">
        <ToolBar />
        <div className="app-canvas-area">
          <MainCanvas />
        </div>
        <div className="app-sidebar">
          <CharacterPalette />
          <ColorPalette />
        </div>
      </div>
      <div className="app-statusbar">
        <span className="status-item">
          ({cursorPos.x}, {cursorPos.y})
        </span>
        <span className="status-item">Char: {charDisplay}</span>
        <span className="status-item">Tool: {activeTool}</span>
        <span className="status-item">
          {doc.grid.width}x{doc.grid.height}
        </span>
      </div>
    </div>
  );
}

export default App;
