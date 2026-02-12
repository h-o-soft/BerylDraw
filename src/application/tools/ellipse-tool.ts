import type { Cell } from "../../domain/cell";
import type { CellUpdate } from "../../domain/grid";
import type { Position } from "../../domain/position";
import { ellipseOutline, ellipseFill } from "../../domain/geometry";
import { PaintCellsCommand } from "../commands/paint-cells-command";
import type { Tool, ToolEvent, ToolContext } from "./tool";

export class EllipseTool implements Tool {
  readonly name = "ellipse";
  readonly icon = "O";
  readonly shortcut = "O";
  readonly hasFillMode = true;
  filled = false;

  private startPos: Position | null = null;
  private currentPos: Position | null = null;
  private previewUpdates: CellUpdate[] | null = null;

  onPointerDown(event: ToolEvent, _context: ToolContext): void {
    this.startPos = { x: event.cellX, y: event.cellY };
    this.currentPos = this.startPos;
    this.updatePreview(_context);
  }

  onPointerMove(event: ToolEvent, context: ToolContext): void {
    if (!this.startPos) return;
    this.currentPos = { x: event.cellX, y: event.cellY };
    this.updatePreview(context);
  }

  onPointerUp(_event: ToolEvent, context: ToolContext): void {
    if (!this.startPos || !this.currentPos) return;

    const updates = this.computeUpdates(context);
    if (updates.length > 0) {
      context.executeCommand(new PaintCellsCommand(updates));
    }

    this.startPos = null;
    this.currentPos = null;
    this.previewUpdates = null;
  }

  getPreview(): CellUpdate[] | null {
    return this.previewUpdates;
  }

  private updatePreview(context: ToolContext): void {
    this.previewUpdates = this.computeUpdates(context);
    context.requestPreviewUpdate();
  }

  private computeUpdates(context: ToolContext): CellUpdate[] {
    if (!this.startPos || !this.currentPos) return [];

    const cell: Cell = {
      char: context.currentChar,
      fg: context.currentFg,
      bg: context.currentBg,
    };

    // 始点と終点から中心と半径を計算
    const cx = Math.round((this.startPos.x + this.currentPos.x) / 2);
    const cy = Math.round((this.startPos.y + this.currentPos.y) / 2);
    const rx = Math.abs(Math.round((this.currentPos.x - this.startPos.x) / 2));
    const ry = Math.abs(Math.round((this.currentPos.y - this.startPos.y) / 2));

    const positions = this.filled
      ? ellipseFill(cx, cy, rx, ry)
      : ellipseOutline(cx, cy, rx, ry);

    return positions.map((pos) => ({ x: pos.x, y: pos.y, cell }));
  }
}
