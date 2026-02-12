import { type Cell, cellEquals } from "../../domain/cell";
import { getCell, isInBounds, type CellUpdate, type Grid } from "../../domain/grid";
import { PaintCellsCommand } from "../commands/paint-cells-command";
import type { Tool, ToolEvent, ToolContext } from "./tool";

/** BFSフラッドフィル */
function floodFill(
  grid: Grid,
  startX: number,
  startY: number,
  newCell: Cell,
): CellUpdate[] {
  if (!isInBounds(grid, startX, startY)) return [];

  const targetCell = getCell(grid, startX, startY);
  if (cellEquals(targetCell, newCell)) return [];

  const updates: CellUpdate[] = [];
  const visited = new Set<string>();
  const queue: Array<[number, number]> = [[startX, startY]];

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (!isInBounds(grid, x, y)) continue;

    const cell = getCell(grid, x, y);
    if (!cellEquals(cell, targetCell)) continue;

    visited.add(key);
    updates.push({ x, y, cell: newCell });

    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return updates;
}

export class FillTool implements Tool {
  readonly name = "fill";
  readonly icon = "F";
  readonly shortcut = "F";

  onPointerDown(event: ToolEvent, context: ToolContext): void {
    const newCell: Cell = {
      char: context.currentChar,
      fg: context.currentFg,
      bg: context.currentBg,
    };

    const updates = floodFill(
      context.grid as Grid,
      event.cellX,
      event.cellY,
      newCell,
    );

    if (updates.length > 0) {
      context.executeCommand(new PaintCellsCommand(updates));
    }
  }

  onPointerMove(_event: ToolEvent, _context: ToolContext): void {}
  onPointerUp(_event: ToolEvent, _context: ToolContext): void {}

  getPreview(): CellUpdate[] | null {
    return null;
  }
}
