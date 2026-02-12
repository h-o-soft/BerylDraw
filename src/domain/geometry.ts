import type { Position } from "./position";

/** 矩形の枠セル座標を列挙 */
export function rectOutline(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Position[] {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const result: Position[] = [];

  for (let x = minX; x <= maxX; x++) {
    result.push({ x, y: minY });
    if (maxY !== minY) result.push({ x, y: maxY });
  }
  for (let y = minY + 1; y < maxY; y++) {
    result.push({ x: minX, y });
    if (maxX !== minX) result.push({ x: maxX, y });
  }

  return result;
}

/** 矩形の塗りつぶしセル座標を列挙 */
export function rectFill(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): Position[] {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const result: Position[] = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      result.push({ x, y });
    }
  }

  return result;
}

/** 楕円の枠セル座標を列挙 (中点楕円アルゴリズム) */
export function ellipseOutline(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): Position[] {
  const points = new Set<string>();
  const result: Position[] = [];

  function addPoint(x: number, y: number) {
    const key = `${x},${y}`;
    if (!points.has(key)) {
      points.add(key);
      result.push({ x, y });
    }
  }

  // 4象限にプロット
  function plotSymmetric(px: number, py: number) {
    addPoint(cx + px, cy + py);
    addPoint(cx - px, cy + py);
    addPoint(cx + px, cy - py);
    addPoint(cx - px, cy - py);
  }

  if (rx === 0 && ry === 0) {
    addPoint(cx, cy);
    return result;
  }

  const a2 = rx * rx;
  const b2 = ry * ry;

  // Region 1
  let x = 0;
  let y = ry;
  let d1 = b2 - a2 * ry + 0.25 * a2;
  let dx = 2 * b2 * x;
  let dy = 2 * a2 * y;

  while (dx < dy) {
    plotSymmetric(x, y);
    x++;
    dx += 2 * b2;
    if (d1 < 0) {
      d1 += dx + b2;
    } else {
      y--;
      dy -= 2 * a2;
      d1 += dx - dy + b2;
    }
  }

  // Region 2
  let d2 = b2 * (x + 0.5) * (x + 0.5) + a2 * (y - 1) * (y - 1) - a2 * b2;
  while (y >= 0) {
    plotSymmetric(x, y);
    y--;
    dy -= 2 * a2;
    if (d2 > 0) {
      d2 += a2 - dy;
    } else {
      x++;
      dx += 2 * b2;
      d2 += dx - dy + a2;
    }
  }

  return result;
}

/** 楕円の塗りつぶしセル座標を列挙 */
export function ellipseFill(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): Position[] {
  const result: Position[] = [];

  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      // 楕円の内部判定
      const nx = (x - cx) / (rx || 1);
      const ny = (y - cy) / (ry || 1);
      if (nx * nx + ny * ny <= 1.0) {
        result.push({ x, y });
      }
    }
  }

  return result;
}
