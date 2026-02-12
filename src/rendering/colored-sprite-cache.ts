import { AnsiColor, type PaletteData, PALETTES } from "../domain/cell";
import { CHAR_WIDTH, CHAR_HEIGHT, MisakiSpriteSheet } from "./sprite-sheet";

/**
 * 各色で着色済みのスプライトシートをキャッシュする。
 * 元画像(黒文字/白背景)を8色分のOffscreenCanvasに変換。
 * 各色版は「色文字/透過背景」となる。
 */
export class ColoredSpriteCache {
  private caches: Map<AnsiColor, OffscreenCanvas> = new Map();
  private sourceImageData: ImageData | null = null;
  private sourceWidth = 0;
  private sourceHeight = 0;

  /** 元スプライトシートから各色版を生成してキャッシュ */
  generate(
    _spriteSheet: MisakiSpriteSheet,
    sourceImage: HTMLImageElement,
    palette: PaletteData = PALETTES.ansi,
  ): void {
    const w = sourceImage.width;
    const h = sourceImage.height;

    // 元画像のピクセルデータを保持 (パレット切り替え時の再生成用)
    const srcCanvas = new OffscreenCanvas(w, h);
    const srcCtx = srcCanvas.getContext("2d")!;
    srcCtx.drawImage(sourceImage, 0, 0);
    this.sourceImageData = srcCtx.getImageData(0, 0, w, h);
    this.sourceWidth = w;
    this.sourceHeight = h;

    this.regenerate(palette);
  }

  /** パレット変更時に再生成する */
  regenerate(palette: PaletteData): void {
    if (!this.sourceImageData) return;

    const w = this.sourceWidth;
    const h = this.sourceHeight;
    const srcData = this.sourceImageData;

    for (let color = AnsiColor.Black; color <= AnsiColor.White; color++) {
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d")!;

      const imageData = ctx.createImageData(w, h);
      const [r, g, b] = palette.rgb[color as AnsiColor]!;

      for (let i = 0; i < srcData.data.length; i += 4) {
        const srcR = srcData.data[i]!;
        // 黒ピクセル(元の文字部分) → 指定色、不透明
        // 白ピクセル(背景) → 透過
        if (srcR < 128) {
          imageData.data[i] = r;
          imageData.data[i + 1] = g;
          imageData.data[i + 2] = b;
          imageData.data[i + 3] = 255;
        } else {
          imageData.data[i] = 0;
          imageData.data[i + 1] = 0;
          imageData.data[i + 2] = 0;
          imageData.data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      this.caches.set(color as AnsiColor, canvas);
    }
  }

  /** 指定色のスプライトシートを取得 */
  get(color: AnsiColor): OffscreenCanvas | undefined {
    return this.caches.get(color);
  }

  /** キャッシュ済みか */
  get ready(): boolean {
    return this.caches.size === 8;
  }

  /**
   * 指定した色・区点の文字を、対象Canvasに描画する。
   * 背景色はこのメソッドの呼び出し前にfillRectで塗っておくこと。
   */
  drawChar(
    ctx: CanvasRenderingContext2D,
    fgColor: AnsiColor,
    sx: number,
    sy: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void {
    const sheet = this.caches.get(fgColor);
    if (!sheet) return;

    ctx.drawImage(
      sheet,
      sx,
      sy,
      CHAR_WIDTH,
      CHAR_HEIGHT,
      dx,
      dy,
      dw,
      dh,
    );
  }
}
