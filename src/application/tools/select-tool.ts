import { DEFAULT_CELL } from "../../domain/cell";
import { getCell, type CellUpdate, type Grid } from "../../domain/grid";
import type { Position, Selection } from "../../domain/position";
import { normalizeSelection } from "../../domain/position";
import type { Tool, ToolEvent, ToolContext } from "./tool";

export class SelectTool implements Tool {
  readonly name = "select";
  readonly icon = "S";
  readonly shortcut = "S";

  private startPos: Position | null = null;
  private isDragging = false;

  onPointerDown(event: ToolEvent, context: ToolContext): void {
    this.startPos = { x: event.cellX, y: event.cellY };
    this.isDragging = true;
    context.setCursorPos(event.cellX, event.cellY);
    context.setSelection({
      start: this.startPos,
      end: this.startPos,
    });
  }

  onPointerMove(event: ToolEvent, context: ToolContext): void {
    if (!this.isDragging || !this.startPos) return;
    context.setCursorPos(event.cellX, event.cellY);
    context.setSelection({
      start: this.startPos,
      end: { x: event.cellX, y: event.cellY },
    });
  }

  onPointerUp(event: ToolEvent, context: ToolContext): void {
    if (!this.isDragging || !this.startPos) return;
    this.isDragging = false;
    context.setSelection({
      start: this.startPos,
      end: { x: event.cellX, y: event.cellY },
    });
    this.startPos = null;
  }

  getPreview(): CellUpdate[] | null {
    return null;
  }

  static copySelection(grid: Grid, selection: Selection): CellUpdate[] {
    const norm = normalizeSelection(selection);
    const updates: CellUpdate[] = [];

    for (let y = norm.start.y; y <= norm.end.y; y++) {
      for (let x = norm.start.x; x <= norm.end.x; x++) {
        updates.push({
          x: x - norm.start.x,
          y: y - norm.start.y,
          cell: getCell(grid, x, y),
        });
      }
    }

    return updates;
  }

  static pasteClipboard(
    clipboard: CellUpdate[],
    offsetX: number,
    offsetY: number,
  ): CellUpdate[] {
    return clipboard.map((u) => ({
      x: u.x + offsetX,
      y: u.y + offsetY,
      cell: u.cell,
    }));
  }

  static deleteSelection(selection: Selection): CellUpdate[] {
    const norm = normalizeSelection(selection);
    const updates: CellUpdate[] = [];

    for (let y = norm.start.y; y <= norm.end.y; y++) {
      for (let x = norm.start.x; x <= norm.end.x; x++) {
        updates.push({ x, y, cell: DEFAULT_CELL });
      }
    }

    return updates;
  }
}
