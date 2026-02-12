import { AnsiColor, DEFAULT_CELL, type Cell } from "../domain/cell";
import { fullWidthToHalf, normalizeToFullWidth } from "../domain/char-mapping";
import type { BerylDocument } from "../domain/document";
import type { Grid } from "../domain/grid";

/** BerylDraw独自保存形式 (v1) */
interface BerylDrawFileV1 {
  version: 1;
  name: string;
  width: number;
  height: number;
  cells: Array<[number, number, number] | null>;
}

/** ドキュメント → JSON文字列 */
export function serializeDocument(doc: BerylDocument): string {
  const cells: Array<[number, number, number] | null> = doc.grid.cells.map(
    (cell) => {
      if (
        cell.char === DEFAULT_CELL.char &&
        cell.fg === DEFAULT_CELL.fg &&
        cell.bg === DEFAULT_CELL.bg
      ) {
        return null;
      }
      return [fullWidthToHalf(cell.char), cell.fg, cell.bg];
    },
  );

  const file: BerylDrawFileV1 = {
    version: 1,
    name: doc.name,
    width: doc.grid.width,
    height: doc.grid.height,
    cells,
  };

  return JSON.stringify(file);
}

/** JSON文字列 → ドキュメント */
export function deserializeDocument(json: string): BerylDocument {
  const file = JSON.parse(json) as BerylDrawFileV1;

  if (file.version !== 1) {
    throw new Error(`Unsupported file version: ${file.version}`);
  }

  const cells: Cell[] = file.cells.map((entry) => {
    if (entry === null) return { ...DEFAULT_CELL };
    return {
      char: normalizeToFullWidth(entry[0]),
      fg: entry[1] as AnsiColor,
      bg: entry[2] as AnsiColor,
    };
  });

  const grid: Grid = {
    width: file.width,
    height: file.height,
    cells,
  };

  return {
    name: file.name,
    grid,
    filePath: null,
    dirty: false,
  };
}
