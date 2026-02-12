import type { AnsiColor } from "../../domain/cell";
import type { Grid, CellUpdate } from "../../domain/grid";
import type { Selection } from "../../domain/position";
import type { Command } from "../commands/command";

/** マウスイベントのセル座標 + 修飾キー情報 */
export interface ToolEvent {
  readonly cellX: number;
  readonly cellY: number;
  readonly shift: boolean;
  readonly ctrl: boolean;
  /** 左ボタン=0, 右ボタン=2 */
  readonly button: number;
}

/** ツールが操作に使うコンテキスト */
export interface ToolContext {
  readonly grid: Readonly<Grid>;
  readonly currentChar: number;
  readonly currentFg: AnsiColor;
  readonly currentBg: AnsiColor;
  executeCommand(command: Command): void;
  setCurrentChar(char: number): void;
  setCurrentFg(color: AnsiColor): void;
  setCurrentBg(color: AnsiColor): void;
  setCursorPos(x: number, y: number): void;
  setSelection(sel: Selection | null): void;
  requestPreviewUpdate(): void;
}

/** ツールのライフサイクルインターフェース */
export interface Tool {
  readonly name: string;
  readonly icon: string;
  readonly shortcut: string;

  onPointerDown(event: ToolEvent, context: ToolContext): void;
  onPointerMove(event: ToolEvent, context: ToolContext): void;
  onPointerUp(event: ToolEvent, context: ToolContext): void;

  getPreview(): CellUpdate[] | null;

  /** テキストツール用 */
  onTextInput?(text: string, context: ToolContext): void;
  onComposition?(
    text: string,
    phase: "start" | "update" | "end",
    context: ToolContext,
  ): void;
  onKeyDown?(event: KeyboardEvent, context: ToolContext): boolean;

  /** テキスト入力が必要なツールか */
  readonly needsTextInput?: boolean;

  /** ツールがアクティブ化/非アクティブ化された時 */
  onActivate?(context: ToolContext): void;
  onDeactivate?(context: ToolContext): void;

  /** 塗りつぶしモードを持つツールか */
  readonly hasFillMode?: boolean;
  filled?: boolean;
}
