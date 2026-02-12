import type { Cell } from "../../domain/cell";
import { getCell, setCells, type CellUpdate, type Grid } from "../../domain/grid";
import type { Command } from "./command";

/**
 * セルの描画コマンド。
 * ペンツール、矩形ツール、円ツール、フィルツール等で共通使用。
 */
export class PaintCellsCommand implements Command {
  readonly description: string;
  private readonly changes: readonly CellUpdate[];
  private previousCells: Array<{ x: number; y: number; cell: Cell }> | null =
    null;

  constructor(changes: readonly CellUpdate[]) {
    this.changes = changes;
    this.description = `Paint ${changes.length} cell(s)`;
  }

  execute(grid: Grid): Grid {
    if (this.previousCells === null) {
      this.previousCells = this.changes.map(({ x, y }) => ({
        x,
        y,
        cell: getCell(grid, x, y),
      }));
    }
    return setCells(grid, this.changes);
  }

  undo(grid: Grid): Grid {
    if (!this.previousCells) {
      throw new Error("Cannot undo: command has not been executed");
    }
    return setCells(grid, this.previousCells);
  }
}
