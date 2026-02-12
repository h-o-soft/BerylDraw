import { DEFAULT_CELL } from "../../domain/cell";
import type { CellUpdate } from "../../domain/grid";
import { PaintCellsCommand } from "../commands/paint-cells-command";
import type { Tool, ToolEvent, ToolContext } from "./tool";

export class EraserTool implements Tool {
  readonly name = "eraser";
  readonly icon = "E";
  readonly shortcut = "E";

  private updates: CellUpdate[] = [];
  private visitedCells = new Set<string>();
  private isDrawing = false;

  onPointerDown(event: ToolEvent, context: ToolContext): void {
    this.isDrawing = true;
    this.updates = [];
    this.visitedCells.clear();
    this.addPoint(event, context);
  }

  onPointerMove(event: ToolEvent, context: ToolContext): void {
    if (!this.isDrawing) return;
    this.addPoint(event, context);
  }

  onPointerUp(_event: ToolEvent, context: ToolContext): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.updates.length > 0) {
      context.executeCommand(new PaintCellsCommand(this.updates));
    }
    this.updates = [];
    this.visitedCells.clear();
  }

  getPreview(): CellUpdate[] | null {
    return this.updates.length > 0 ? this.updates : null;
  }

  private addPoint(event: ToolEvent, _context: ToolContext): void {
    const key = `${event.cellX},${event.cellY}`;
    if (this.visitedCells.has(key)) return;
    this.visitedCells.add(key);

    this.updates.push({
      x: event.cellX,
      y: event.cellY,
      cell: DEFAULT_CELL,
    });
    _context.requestPreviewUpdate();
  }
}
