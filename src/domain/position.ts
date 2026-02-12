/** セル座標 */
export interface Position {
  readonly x: number;
  readonly y: number;
}

/** 矩形選択範囲 */
export interface Selection {
  readonly start: Position;
  readonly end: Position;
}

/** 選択範囲を正規化(start < end になるように) */
export function normalizeSelection(sel: Selection): Selection {
  return {
    start: {
      x: Math.min(sel.start.x, sel.end.x),
      y: Math.min(sel.start.y, sel.end.y),
    },
    end: {
      x: Math.max(sel.start.x, sel.end.x),
      y: Math.max(sel.start.y, sel.end.y),
    },
  };
}

/** 座標が選択範囲内にあるか */
export function isInSelection(pos: Position, sel: Selection): boolean {
  const n = normalizeSelection(sel);
  return (
    pos.x >= n.start.x &&
    pos.x <= n.end.x &&
    pos.y >= n.start.y &&
    pos.y <= n.end.y
  );
}
