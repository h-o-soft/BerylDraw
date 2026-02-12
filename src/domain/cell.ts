/** ANSI標準8色 */
export enum AnsiColor {
  Black = 0,
  Red = 1,
  Green = 2,
  Yellow = 3,
  Blue = 4,
  Magenta = 5,
  Cyan = 6,
  White = 7,
}

/** 1セルの内部表現 */
export interface Cell {
  /** 文字のUnicodeコードポイント (全角統一) */
  readonly char: number;
  /** 前景色 (0-7) */
  readonly fg: AnsiColor;
  /** 背景色 (0-7) */
  readonly bg: AnsiColor;
}

/** デフォルトセル (全角スペース, 白文字, 黒背景) */
export const DEFAULT_CELL: Cell = {
  char: 0x3000, // 全角スペース
  fg: AnsiColor.White,
  bg: AnsiColor.Black,
};

/** パレットデータ */
export interface PaletteData {
  readonly label: string;
  readonly css: Record<AnsiColor, string>;
  readonly rgb: Record<AnsiColor, [number, number, number]>;
}

export type PaletteName = "ansi" | "c64";

/** デジタル8色 ANSI パレット (R,G,B 各 0 or 255) */
const ANSI_PALETTE: PaletteData = {
  label: "ANSI",
  css: {
    [AnsiColor.Black]: "#000000",
    [AnsiColor.Red]: "#ff0000",
    [AnsiColor.Green]: "#00ff00",
    [AnsiColor.Yellow]: "#ffff00",
    [AnsiColor.Blue]: "#0000ff",
    [AnsiColor.Magenta]: "#ff00ff",
    [AnsiColor.Cyan]: "#00ffff",
    [AnsiColor.White]: "#ffffff",
  },
  rgb: {
    [AnsiColor.Black]: [0x00, 0x00, 0x00],
    [AnsiColor.Red]: [0xff, 0x00, 0x00],
    [AnsiColor.Green]: [0x00, 0xff, 0x00],
    [AnsiColor.Yellow]: [0xff, 0xff, 0x00],
    [AnsiColor.Blue]: [0x00, 0x00, 0xff],
    [AnsiColor.Magenta]: [0xff, 0x00, 0xff],
    [AnsiColor.Cyan]: [0x00, 0xff, 0xff],
    [AnsiColor.White]: [0xff, 0xff, 0xff],
  },
};

/** Commodore 64 パレット (Colodore model, ANSI色インデックスにマッピング) */
const C64_PALETTE: PaletteData = {
  label: "C64",
  css: {
    [AnsiColor.Black]: "#000000",   // C64 0 Black
    [AnsiColor.Red]: "#813338",     // C64 2 Red
    [AnsiColor.Green]: "#56ac4d",   // C64 5 Green
    [AnsiColor.Yellow]: "#edf171",  // C64 7 Yellow
    [AnsiColor.Blue]: "#2e2c9b",    // C64 6 Blue
    [AnsiColor.Magenta]: "#8e3c97", // C64 4 Purple
    [AnsiColor.Cyan]: "#75cec8",    // C64 3 Cyan
    [AnsiColor.White]: "#ffffff",   // C64 1 White
  },
  rgb: {
    [AnsiColor.Black]: [0x00, 0x00, 0x00],
    [AnsiColor.Red]: [0x81, 0x33, 0x38],
    [AnsiColor.Green]: [0x56, 0xac, 0x4d],
    [AnsiColor.Yellow]: [0xed, 0xf1, 0x71],
    [AnsiColor.Blue]: [0x2e, 0x2c, 0x9b],
    [AnsiColor.Magenta]: [0x8e, 0x3c, 0x97],
    [AnsiColor.Cyan]: [0x75, 0xce, 0xc8],
    [AnsiColor.White]: [0xff, 0xff, 0xff],
  },
};

export const PALETTES: Record<PaletteName, PaletteData> = {
  ansi: ANSI_PALETTE,
  c64: C64_PALETTE,
};

/** デフォルトパレット (後方互換用) */
export const COLOR_CSS = ANSI_PALETTE.css;
export const COLOR_RGB = ANSI_PALETTE.rgb;

/** セルが等しいか判定 */
export function cellEquals(a: Cell, b: Cell): boolean {
  return a.char === b.char && a.fg === b.fg && a.bg === b.bg;
}
