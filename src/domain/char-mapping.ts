import Encoding from "encoding-japanese";

/**
 * 半角→全角マッピング。
 * ASCII (0x21-0x7E) → 全角形式 (U+FF01-U+FF5E)
 * 半角スペース → 全角スペース
 */
function halfToFullAscii(cp: number): number | null {
  if (cp === 0x0020) return 0x3000; // SPACE → 全角スペース
  if (cp >= 0x0021 && cp <= 0x007e) return cp - 0x0021 + 0xff01;
  return null;
}

/** 半角カタカナ→全角カタカナのマッピングテーブル */
const HANKAKU_KANA_MAP: Record<number, number> = {
  0xff61: 0x3002, // ｡ → 。
  0xff62: 0x300c, // ｢ → 「
  0xff63: 0x300d, // ｣ → 」
  0xff64: 0x3001, // ､ → 、
  0xff65: 0x30fb, // ･ → ・
  0xff66: 0x30f2, // ｦ → ヲ
  0xff67: 0x30a1, // ｧ → ァ
  0xff68: 0x30a3, // ｨ → ィ
  0xff69: 0x30a5, // ｩ → ゥ
  0xff6a: 0x30a7, // ｪ → ェ
  0xff6b: 0x30a9, // ｫ → ォ
  0xff6c: 0x30e3, // ｬ → ャ
  0xff6d: 0x30e5, // ｭ → ュ
  0xff6e: 0x30e7, // ｮ → ョ
  0xff6f: 0x30c3, // ｯ → ッ
  0xff70: 0x30fc, // ｰ → ー
  0xff71: 0x30a2, // ｱ → ア
  0xff72: 0x30a4, // ｲ → イ
  0xff73: 0x30a6, // ｳ → ウ
  0xff74: 0x30a8, // ｴ → エ
  0xff75: 0x30aa, // ｵ → オ
  0xff76: 0x30ab, // ｶ → カ
  0xff77: 0x30ad, // ｷ → キ
  0xff78: 0x30af, // ｸ → ク
  0xff79: 0x30b1, // ｹ → ケ
  0xff7a: 0x30b3, // ｺ → コ
  0xff7b: 0x30b5, // ｻ → サ
  0xff7c: 0x30b7, // ｼ → シ
  0xff7d: 0x30b9, // ｽ → ス
  0xff7e: 0x30bb, // ｾ → セ
  0xff7f: 0x30bd, // ｿ → ソ
  0xff80: 0x30bf, // ﾀ → タ
  0xff81: 0x30c1, // ﾁ → チ
  0xff82: 0x30c4, // ﾂ → ツ
  0xff83: 0x30c6, // ﾃ → テ
  0xff84: 0x30c8, // ﾄ → ト
  0xff85: 0x30ca, // ﾅ → ナ
  0xff86: 0x30cb, // ﾆ → ニ
  0xff87: 0x30cc, // ﾇ → ヌ
  0xff88: 0x30cd, // ﾈ → ネ
  0xff89: 0x30ce, // ﾉ → ノ
  0xff8a: 0x30cf, // ﾊ → ハ
  0xff8b: 0x30d2, // ﾋ → ヒ
  0xff8c: 0x30d5, // ﾌ → フ
  0xff8d: 0x30d8, // ﾍ → ヘ
  0xff8e: 0x30db, // ﾎ → ホ
  0xff8f: 0x30de, // ﾏ → マ
  0xff90: 0x30df, // ﾐ → ミ
  0xff91: 0x30e0, // ﾑ → ム
  0xff92: 0x30e1, // ﾒ → メ
  0xff93: 0x30e2, // ﾓ → モ
  0xff94: 0x30e4, // ﾔ → ヤ
  0xff95: 0x30e6, // ﾕ → ユ
  0xff96: 0x30e8, // ﾖ → ヨ
  0xff97: 0x30e9, // ﾗ → ラ
  0xff98: 0x30ea, // ﾘ → リ
  0xff99: 0x30eb, // ﾙ → ル
  0xff9a: 0x30ec, // ﾚ → レ
  0xff9b: 0x30ed, // ﾛ → ロ
  0xff9c: 0x30ef, // ﾜ → ワ
  0xff9d: 0x30f3, // ﾝ → ン
  0xff9e: 0x309b, // ﾞ → ゛
  0xff9f: 0x309c, // ﾟ → ゜
};

/**
 * 任意のUnicode文字を全角統一のコードポイントに変換する。
 * 変換不要(既に全角)ならそのまま返す。
 */
export function normalizeToFullWidth(codePoint: number): number {
  // 半角ASCII → 全角
  const fullAscii = halfToFullAscii(codePoint);
  if (fullAscii !== null) return fullAscii;

  // 半角カタカナ → 全角カタカナ
  const fullKana = HANKAKU_KANA_MAP[codePoint];
  if (fullKana !== undefined) return fullKana;

  // 既に全角（そのまま返す）
  return codePoint;
}

/**
 * 全角→半角の逆変換。保存時に使用。
 * 全角形式 (U+FF01-U+FF5E) → ASCII (0x21-0x7E)
 * 全角スペース → 半角スペース
 * 全角カタカナ → 半角カタカナ
 * 変換不要(全角のまま)ならそのまま返す。
 */
export function fullWidthToHalf(codePoint: number): number {
  // 全角スペース → 半角スペース
  if (codePoint === 0x3000) return 0x0020;
  // 全角ASCII → 半角ASCII
  if (codePoint >= 0xff01 && codePoint <= 0xff5e) {
    return codePoint - 0xff01 + 0x0021;
  }
  // 全角カタカナ → 半角カタカナ (逆引き)
  for (const [half, full] of Object.entries(HANKAKU_KANA_MAP)) {
    if (full === codePoint) return Number(half);
  }
  return codePoint;
}

/** JIS区点コード */
export interface KutenCode {
  ku: number; // 1-94
  ten: number; // 1-94
}

/**
 * UnicodeコードポイントをJIS区点コードに変換する。
 * encoding-japaneseを使ってUnicode→JISの変換を行う。
 * 変換不能な文字はnullを返す。
 */
export function unicodeToKuten(codePoint: number): KutenCode | null {
  // 全角スペースは特殊: JISでは区1点1
  if (codePoint === 0x3000) {
    return { ku: 1, ten: 1 };
  }

  // Unicode文字列を作成
  const str = String.fromCodePoint(codePoint);

  // Unicode配列 → JIS配列に変換
  const unicodeArray = Encoding.stringToCode(str);
  const jisArray = Encoding.convert(unicodeArray, {
    to: "JIS",
    from: "UNICODE",
  });

  // JISエンコーディングの解析
  // JIS X 0208の場合: ESC $ B (0x1B 0x24 0x42) + 2バイトJISコード + ESC ( B
  // 2バイトJISコードから区点を計算
  if (jisArray.length >= 5 && jisArray[0] === 0x1b && jisArray[1] === 0x24) {
    // ESC $ B or ESC $ @ の後の2バイトがJISコード
    const offset = jisArray[2] === 0x42 || jisArray[2] === 0x40 ? 3 : -1;
    if (offset >= 0 && offset + 1 < jisArray.length) {
      const byte1 = jisArray[offset]!;
      const byte2 = jisArray[offset + 1]!;
      if (byte1 >= 0x21 && byte1 <= 0x7e && byte2 >= 0x21 && byte2 <= 0x7e) {
        return {
          ku: byte1 - 0x20,
          ten: byte2 - 0x20,
        };
      }
    }
  }

  return null;
}

/**
 * 文字がShiftJIS(JIS X 0208)の範囲内か判定する。
 */
export function isInShiftJISRange(codePoint: number): boolean {
  return unicodeToKuten(codePoint) !== null;
}
