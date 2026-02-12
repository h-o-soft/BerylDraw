import type { Cell } from "../../domain/cell";
import type { CellUpdate } from "../../domain/grid";
import type { Position } from "../../domain/position";
import { rectOutline, rectFill } from "../../domain/geometry";
import { PaintCellsCommand } from "../commands/paint-cells-command";
import type { Tool, ToolEvent, ToolContext } from "./tool";

export class RectangleTool implements Tool {
  readonly name = "rectangle";
  readonly icon = "R";
  readonly shortcut = "R";
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

    const positions = this.filled
      ? rectFill(
          this.startPos.x,
          this.startPos.y,
          this.currentPos.x,
          this.currentPos.y,
        )
      : rectOutline(
          this.startPos.x,
          this.startPos.y,
          this.currentPos.x,
          this.currentPos.y,
        );

    return positions.map((pos) => ({ x: pos.x, y: pos.y, cell }));
  }
}
