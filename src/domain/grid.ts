import { Cell, DEFAULT_CELL, cellEquals } from "./cell";

/** グリッド - セルのFlat Array (Row-major order) */
export interface Grid {
  readonly width: number;
  readonly height: number;
  readonly cells: readonly Cell[];
}

/** 空のグリッドを生成 */
export function createGrid(width: number, height: number): Grid {
  const cells: Cell[] = new Array(width * height);
  for (let i = 0; i < cells.length; i++) {
    cells[i] = DEFAULT_CELL;
  }
  return { width, height, cells };
}

/** セルを取得 (範囲外はDEFAULT_CELL) */
export function getCell(grid: Grid, x: number, y: number): Cell {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) {
    return DEFAULT_CELL;
  }
  return grid.cells[y * grid.width + x]!;
}

/** 単一セルを更新した新しいGridを返す */
export function setCell(
  grid: Grid,
  x: number,
  y: number,
  cell: Cell,
): Grid {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) {
    return grid;
  }
  const index = y * grid.width + x;
  if (cellEquals(grid.cells[index]!, cell)) return grid;
  const newCells = [...grid.cells];
  newCells[index] = cell;
  return { ...grid, cells: newCells };
}

/** セル更新の型 */
export interface CellUpdate {
  readonly x: number;
  readonly y: number;
  readonly cell: Cell;
}

/** 複数セルを一括更新 */
export function setCells(
  grid: Grid,
  updates: readonly CellUpdate[],
): Grid {
  const newCells = [...grid.cells];
  let changed = false;
  for (const { x, y, cell } of updates) {
    if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) continue;
    const index = y * grid.width + x;
    if (!cellEquals(newCells[index]!, cell)) {
      newCells[index] = cell;
      changed = true;
    }
  }
  return changed ? { ...grid, cells: newCells } : grid;
}

/** グリッドをリサイズする (既存セルは保持、拡張部分はデフォルトセル) */
export function resizeGrid(grid: Grid, newWidth: number, newHeight: number): Grid {
  if (newWidth === grid.width && newHeight === grid.height) return grid;
  const cells: Cell[] = new Array(newWidth * newHeight);
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      if (x < grid.width && y < grid.height) {
        cells[y * newWidth + x] = grid.cells[y * grid.width + x]!;
      } else {
        cells[y * newWidth + x] = DEFAULT_CELL;
      }
    }
  }
  return { width: newWidth, height: newHeight, cells };
}

/** 座標がグリッド内か */
export function isInBounds(grid: Grid, x: number, y: number): boolean {
  return x >= 0 && x < grid.width && y >= 0 && y < grid.height;
}
