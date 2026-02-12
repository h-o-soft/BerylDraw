import { AnsiColor } from "../domain/cell";
import { fullWidthToHalf } from "../domain/char-mapping";
import { getCell, type Grid } from "../domain/grid";

/** ANSI前景色コード */
const ANSI_FG_CODES: Record<AnsiColor, number> = {
  [AnsiColor.Black]: 30,
  [AnsiColor.Red]: 31,
  [AnsiColor.Green]: 32,
  [AnsiColor.Yellow]: 33,
  [AnsiColor.Blue]: 34,
  [AnsiColor.Magenta]: 35,
  [AnsiColor.Cyan]: 36,
  [AnsiColor.White]: 37,
};

/** ANSI背景色コード */
const ANSI_BG_CODES: Record<AnsiColor, number> = {
  [AnsiColor.Black]: 40,
  [AnsiColor.Red]: 41,
  [AnsiColor.Green]: 42,
  [AnsiColor.Yellow]: 43,
  [AnsiColor.Blue]: 44,
  [AnsiColor.Magenta]: 45,
  [AnsiColor.Cyan]: 46,
  [AnsiColor.White]: 47,
};

/** セルが「空」(黒背景スペース)かどうか */
function isBlankCell(char: number, bg: AnsiColor): boolean {
  return (char === 0x3000 || char === 0x0020) && bg === AnsiColor.Black;
}

/** グリッドをANSIエスケープシーケンス形式でエクスポート */
export function exportToAns(grid: Grid): string {
  const lines: string[] = [];

  // 行をまたいで色状態を保持 (不要な再設定を避ける)
  let prevFg: AnsiColor | null = null;
  let prevBg: AnsiColor | null = null;

  for (let y = 0; y < grid.height; y++) {
    // 行末の空白セル(黒背景+スペース)をトリムする位置を求める
    let lineEnd = grid.width;
    while (lineEnd > 0) {
      const cell = getCell(grid, lineEnd - 1, y);
      if (!isBlankCell(cell.char, cell.bg)) break;
      lineEnd--;
    }

    let line = "";

    for (let x = 0; x < lineEnd; x++) {
      const cell = getCell(grid, x, y);

      // FG/BG それぞれ変わった分だけSGRシーケンスを出力
      const fgChanged = cell.fg !== prevFg;
      const bgChanged = cell.bg !== prevBg;

      if (fgChanged && bgChanged) {
        line += `\x1b[${ANSI_FG_CODES[cell.fg]};${ANSI_BG_CODES[cell.bg]}m`;
      } else if (fgChanged) {
        line += `\x1b[${ANSI_FG_CODES[cell.fg]}m`;
      } else if (bgChanged) {
        line += `\x1b[${ANSI_BG_CODES[cell.bg]}m`;
      }

      if (fgChanged) prevFg = cell.fg;
      if (bgChanged) prevBg = cell.bg;

      // 全角→半角に変換して出力
      line += String.fromCodePoint(fullWidthToHalf(cell.char));
    }

    // 末尾の空白をトリムした場合、現在の色状態がデフォルト(黒背景)でなければ
    // リセットを出力して色の持ち越しを防ぐ
    if (lineEnd < grid.width && prevBg !== null && prevBg !== AnsiColor.Black) {
      line += "\x1b[0m";
      prevFg = null;
      prevBg = null;
    }

    lines.push(line);
  }

  // 末尾の完全空行をトリム
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }

  // 最後にリセットを付ける (色状態がデフォルトでない場合)
  if (lines.length > 0 && (prevFg !== null || prevBg !== null)) {
    lines[lines.length - 1] += "\x1b[0m";
  }

  return lines.join("\n") + "\n";
}
