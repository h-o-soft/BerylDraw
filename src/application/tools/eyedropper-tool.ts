import { getCell, type CellUpdate, type Grid } from "../../domain/grid";
import type { Tool, ToolEvent, ToolContext } from "./tool";

export class EyedropperTool implements Tool {
  readonly name = "eyedropper";
  readonly icon = "I";
  readonly shortcut = "I";

  onPointerDown(event: ToolEvent, context: ToolContext): void {
    this.pick(event, context);
  }

  onPointerMove(event: ToolEvent, context: ToolContext): void {
    // ドラッグ中もピック
    this.pick(event, context);
  }

  onPointerUp(_event: ToolEvent, _context: ToolContext): void {}

  getPreview(): CellUpdate[] | null {
    return null;
  }

  private pick(event: ToolEvent, context: ToolContext): void {
    const cell = getCell(context.grid as Grid, event.cellX, event.cellY);
    context.setCurrentChar(cell.char);
    context.setCurrentFg(cell.fg);
    context.setCurrentBg(cell.bg);
  }
}
