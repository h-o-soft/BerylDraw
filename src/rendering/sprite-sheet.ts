import type { KutenCode } from "../domain/char-mapping";

/** 1文字のピクセルサイズ */
export const CHAR_WIDTH = 8;
export const CHAR_HEIGHT = 8;

/** スプライトシートの列数・行数 (JIS X 0208: 94区 x 94点) */
const SHEET_COLS = 94;
const SHEET_ROWS = 94;

/**
 * 美咲フォントPNGスプライトシートを管理する。
 * PNGは黒文字(0,0,0)・白背景(255,255,255) の752x752画像。
 * レイアウト: 縦=区(ku), 横=点(ten), 各8x8px。
 */
export class MisakiSpriteSheet {
  private image: HTMLImageElement | null = null;
  private imageData: ImageData | null = null;

  get loaded(): boolean {
    return this.image !== null;
  }

  get width(): number {
    return SHEET_COLS;
  }

  get height(): number {
    return SHEET_ROWS;
  }

  /** PNGを読み込む */
  async load(pngUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        // ImageDataを取得(ピクセル操作用)
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        this.imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to load font: ${pngUrl}`));
      img.src = pngUrl;
    });
  }

  /**
   * 区点コードからスプライトシート上のピクセル座標を計算する。
   * PNG配置: 縦=区, 横=点
   */
  getSpritePosition(kuten: KutenCode): { sx: number; sy: number } {
    return {
      sx: (kuten.ten - 1) * CHAR_WIDTH,
      sy: (kuten.ku - 1) * CHAR_HEIGHT,
    };
  }

  /**
   * 指定した区点の文字のピクセルデータ(8x8)を取得する。
   * 戻り値: 各ピクセルがグリフかどうかのboolean配列(64要素)
   * true = 文字の黒ピクセル, false = 背景
   */
  getGlyphBitmap(kuten: KutenCode): boolean[] {
    if (!this.imageData) return new Array(64).fill(false);

    const { sx, sy } = this.getSpritePosition(kuten);
    const result: boolean[] = new Array(64);
    const { data, width } = this.imageData;

    for (let py = 0; py < CHAR_HEIGHT; py++) {
      for (let px = 0; px < CHAR_WIDTH; px++) {
        const srcIdx = ((sy + py) * width + (sx + px)) * 4;
        // 黒ピクセル(R < 128) = グリフ部分
        result[py * CHAR_WIDTH + px] = data[srcIdx]! < 128;
      }
    }

    return result;
  }
}
