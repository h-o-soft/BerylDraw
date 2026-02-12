import { save, open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import type { BerylDocument } from "../domain/document";
import type { Grid } from "../domain/grid";
import { serializeDocument, deserializeDocument } from "./file-format";
import { exportToAns } from "./ans-exporter";

/** ドキュメントを保存 */
export async function saveDocument(
  doc: BerylDocument,
): Promise<string | null> {
  const filePath =
    doc.filePath ??
    (await save({
      filters: [{ name: "BerylDraw", extensions: ["bdraw"] }],
      defaultPath: `${doc.name}.bdraw`,
    }));

  if (!filePath) return null;

  const json = serializeDocument(doc);
  await writeTextFile(filePath, json);
  return filePath;
}

/** 名前を付けて保存 */
export async function saveDocumentAs(
  doc: BerylDocument,
): Promise<string | null> {
  const filePath = await save({
    filters: [{ name: "BerylDraw", extensions: ["bdraw"] }],
    defaultPath: `${doc.name}.bdraw`,
  });

  if (!filePath) return null;

  const json = serializeDocument(doc);
  await writeTextFile(filePath, json);
  return filePath;
}

/** ドキュメントを開く */
export async function openDocument(): Promise<{
  doc: BerylDocument;
  filePath: string;
} | null> {
  const filePath = await open({
    filters: [{ name: "BerylDraw", extensions: ["bdraw"] }],
    multiple: false,
  });

  if (!filePath) return null;

  const fp = filePath as string;
  const json = await readTextFile(fp);
  const doc = deserializeDocument(json);
  // ファイル名をパスから取得 (拡張子除去)
  const baseName = fp.split(/[/\\]/).pop()?.replace(/\.bdraw$/i, "") ?? doc.name;
  return {
    doc: { ...doc, name: baseName, filePath: fp },
    filePath: fp,
  };
}

/** ANS形式でエクスポート */
export async function exportAns(grid: Grid): Promise<void> {
  const filePath = await save({
    filters: [{ name: "ANS File", extensions: ["ans", "txt"] }],
  });

  if (!filePath) return;

  const content = exportToAns(grid);
  await writeTextFile(filePath, content);
}
