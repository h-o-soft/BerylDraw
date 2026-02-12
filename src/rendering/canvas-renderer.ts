import { Cell, cellEquals, type PaletteData, PALETTES } from "../domain/cell";
import { unicodeToKuten } from "../domain/char-mapping";
import { Grid, type CellUpdate } from "../domain/grid";
import type { Position, Selection } from "../domain/position";
import { normalizeSelection } from "../domain/position";
import { CHAR_WIDTH, CHAR_HEIGHT, MisakiSpriteSheet } from "./sprite-sheet";
import { ColoredSpriteCache } from "./colored-sprite-cache";

/**
 * メインキャンバスのレンダリングエンジン。
 * セルコンテンツは差分更新、オーバーレイ(グリッド線・カーソル・選択)は
 * 別キャンバスに毎フレーム全クリアして描画する。
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private overlayCanvas: HTMLCanvasElement | null = null;
  private overlayCtx: CanvasRenderingContext2D | null = null;
  private spriteSheet: MisakiSpriteSheet;
  private colorCache: ColoredSpriteCache;
  private _scale: number = 2;
  private _palette: PaletteData = PALETTES.ansi;

  /** 前回描画したグリッドのスナップショット (差分検出用) */
  private prevCells: Cell[] | null = null;
  private prevWidth = 0;
  private prevHeight = 0;

  constructor(
    canvas: HTMLCanvasElement,
    spriteSheet: MisakiSpriteSheet,
    colorCache: ColoredSpriteCache,
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.ctx.imageSmoothingEnabled = false;
    this.spriteSheet = spriteSheet;
    this.colorCache = colorCache;
  }

  /** パレットを設定する (変更時は全再描画) */
  set palette(p: PaletteData) {
    if (this._palette !== p) {
      this._palette = p;
      this.prevCells = null;
    }
  }

  get palette(): PaletteData {
    return this._palette;
  }

  /** オーバーレイ用キャンバスを設定する */
  setOverlayCanvas(overlay: HTMLCanvasElement): void {
    this.overlayCanvas = overlay;
    this.overlayCtx = overlay.getContext("2d")!;
    this.overlayCtx.imageSmoothingEnabled = false;
  }

  get scale(): number {
    return this._scale;
  }

  set scale(value: number) {
    if (this._scale !== value) {
      this._scale = value;
      this.prevCells = null; // スケール変更時は全描画
    }
  }

  /** セルのピクセルサイズ (スケール込み) */
  get cellPixelWidth(): number {
    return CHAR_WIDTH * this._scale;
  }

  get cellPixelHeight(): number {
    return CHAR_HEIGHT * this._scale;
  }

  /** グリッド全体を描画する (差分更新) */
  render(grid: Grid): void {
    const { width, height, cells } = grid;
    const scaledW = this.cellPixelWidth;
    const scaledH = this.cellPixelHeight;

    // Canvasサイズの調整
    const canvasW = width * scaledW;
    const canvasH = height * scaledH;
    if (
      this.canvas.width !== canvasW ||
      this.canvas.height !== canvasH
    ) {
      this.canvas.width = canvasW;
      this.canvas.height = canvasH;
      this.ctx.imageSmoothingEnabled = false;
      this.prevCells = null;
      // オーバーレイキャンバスもサイズ同期
      if (this.overlayCanvas) {
        this.overlayCanvas.width = canvasW;
        this.overlayCanvas.height = canvasH;
        if (this.overlayCtx) {
          this.overlayCtx.imageSmoothingEnabled = false;
        }
      }
    }

    // サイズ変更時は全描画
    if (
      this.prevWidth !== width ||
      this.prevHeight !== height
    ) {
      this.prevCells = null;
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const cell = cells[idx]!;

        // 差分チェック
        if (this.prevCells && this.prevCells[idx] && cellEquals(this.prevCells[idx], cell)) {
          continue;
        }

        this.renderCell(cell, x * scaledW, y * scaledH, scaledW, scaledH);
      }
    }

    this.prevCells = [...cells];
    this.prevWidth = width;
    this.prevHeight = height;
  }

  /** 1セルを描画 */
  private renderCell(
    cell: Cell,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void {
    // 背景色を塗る
    this.ctx.fillStyle = this._palette.css[cell.bg];
    this.ctx.fillRect(dx, dy, dw, dh);

    // 全角スペースは文字描画不要
    if (cell.char === 0x3000) return;

    // 文字を描画
    const kuten = unicodeToKuten(cell.char);
    if (!kuten) return;

    const { sx, sy } = this.spriteSheet.getSpritePosition(kuten);
    this.colorCache.drawChar(
      this.ctx,
      cell.fg,
      sx,
      sy,
      dx,
      dy,
      dw,
      dh,
    );
  }

  /** 全体を強制再描画 */
  forceRedraw(grid: Grid): void {
    this.prevCells = null;
    this.render(grid);
  }

  /** オーバーレイを全クリアする (毎フレーム呼ぶ) */
  clearOverlay(): void {
    const ctx = this.overlayCtx;
    const canvas = this.overlayCanvas;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  /** グリッド線を描画 (オーバーレイキャンバスに描画) */
  renderGridLines(grid: Grid): void {
    const ctx = this.overlayCtx ?? this.ctx;
    const scaledW = this.cellPixelWidth;
    const scaledH = this.cellPixelHeight;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;

    // 縦線
    for (let x = 1; x < grid.width; x++) {
      const px = x * scaledW + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, grid.height * scaledH);
      ctx.stroke();
    }

    // 横線
    for (let y = 1; y < grid.height; y++) {
      const py = y * scaledH + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(grid.width * scaledW, py);
      ctx.stroke();
    }
  }

  /** カーソルを描画 (オーバーレイキャンバスに描画) */
  renderCursor(pos: Position, grid: Grid): void {
    if (pos.x < 0 || pos.x >= grid.width || pos.y < 0 || pos.y >= grid.height) {
      return;
    }

    const ctx = this.overlayCtx ?? this.ctx;
    const scaledW = this.cellPixelWidth;
    const scaledH = this.cellPixelHeight;
    const dx = pos.x * scaledW;
    const dy = pos.y * scaledH;

    ctx.strokeStyle = "rgba(255, 255, 0, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(dx + 1, dy + 1, scaledW - 2, scaledH - 2);
  }

  /** 選択範囲を描画 (オーバーレイキャンバスに描画) */
  renderSelection(sel: Selection, grid: Grid): void {
    const ctx = this.overlayCtx ?? this.ctx;
    const n = normalizeSelection(sel);
    const scaledW = this.cellPixelWidth;
    const scaledH = this.cellPixelHeight;

    const x1 = Math.max(0, n.start.x);
    const y1 = Math.max(0, n.start.y);
    const x2 = Math.min(grid.width - 1, n.end.x);
    const y2 = Math.min(grid.height - 1, n.end.y);

    ctx.fillStyle = "rgba(100, 150, 255, 0.3)";
    ctx.fillRect(
      x1 * scaledW,
      y1 * scaledH,
      (x2 - x1 + 1) * scaledW,
      (y2 - y1 + 1) * scaledH,
    );

    ctx.strokeStyle = "rgba(100, 150, 255, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x1 * scaledW + 0.5,
      y1 * scaledH + 0.5,
      (x2 - x1 + 1) * scaledW - 1,
      (y2 - y1 + 1) * scaledH - 1,
    );
  }

  /** プレビューセルを描画 (オーバーレイキャンバスに描画) */
  renderPreviewCells(updates: CellUpdate[], grid: Grid): void {
    const ctx = this.overlayCtx ?? this.ctx;
    const scaledW = this.cellPixelWidth;
    const scaledH = this.cellPixelHeight;

    for (const update of updates) {
      if (update.x < 0 || update.x >= grid.width || update.y < 0 || update.y >= grid.height) {
        continue;
      }

      const dx = update.x * scaledW;
      const dy = update.y * scaledH;

      // 背景色を塗る
      ctx.fillStyle = this._palette.css[update.cell.bg];
      ctx.fillRect(dx, dy, scaledW, scaledH);

      // 全角スペースは文字描画不要
      if (update.cell.char === 0x3000) continue;

      // 文字を描画
      const kuten = unicodeToKuten(update.cell.char);
      if (!kuten) continue;

      const { sx, sy } = this.spriteSheet.getSpritePosition(kuten);
      this.colorCache.drawChar(ctx, update.cell.fg, sx, sy, dx, dy, scaledW, scaledH);
    }
  }

  /** スクリーン座標 → セル座標変換 */
  screenToCell(screenX: number, screenY: number): Position {
    return {
      x: Math.floor(screenX / this.cellPixelWidth),
      y: Math.floor(screenY / this.cellPixelHeight),
    };
  }
}
