import type { Cell } from "../../domain/cell";
import type { CellUpdate } from "../../domain/grid";
import { normalizeToFullWidth } from "../../domain/char-mapping";
import { PaintCellsCommand } from "../commands/paint-cells-command";
import type { Tool, ToolEvent, ToolContext } from "./tool";

export class TextTool implements Tool {
  readonly name = "text";
  readonly icon = "T";
  readonly shortcut = "T";
  readonly needsTextInput = true;

  private cursorX = 0;
  private cursorY = 0;
  private startX = 0;
  private sessionUpdates: CellUpdate[] = [];
  private isActive = false;
  private gridWidth = 40;
  private gridHeight = 25;

  // IME未確定テキストのプレビュー
  private compositionPreview: CellUpdate[] = [];

  onPointerDown(event: ToolEvent, context: ToolContext): void {
    // 既存セッションがあれば確定
    if (this.isActive && this.sessionUpdates.length > 0) {
      context.executeCommand(new PaintCellsCommand(this.sessionUpdates));
    }

    this.cursorX = event.cellX;
    this.cursorY = event.cellY;
    this.startX = event.cellX;
    this.sessionUpdates = [];
    this.compositionPreview = [];
    this.isActive = true;
    this.gridWidth = context.grid.width;
    this.gridHeight = context.grid.height;

    context.setCursorPos(this.cursorX, this.cursorY);
    context.requestPreviewUpdate();
  }

  onPointerMove(_event: ToolEvent, _context: ToolContext): void {}
  onPointerUp(_event: ToolEvent, _context: ToolContext): void {}

  onTextInput(text: string, context: ToolContext): void {
    if (!this.isActive) return;

    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (cp === undefined) continue;

      const fullWidth = normalizeToFullWidth(cp);
      const cell: Cell = {
        char: fullWidth,
        fg: context.currentFg,
        bg: context.currentBg,
      };

      this.sessionUpdates.push({
        x: this.cursorX,
        y: this.cursorY,
        cell,
      });

      this.advanceCursor();
    }

    context.setCursorPos(this.cursorX, this.cursorY);
    context.requestPreviewUpdate();
  }

  onComposition(
    text: string,
    phase: "start" | "update" | "end",
    context: ToolContext,
  ): void {
    if (!this.isActive) return;

    if (phase === "start" || phase === "update") {
      // 未確定テキストのプレビュー
      this.compositionPreview = [];
      let cx = this.cursorX;
      let cy = this.cursorY;

      for (const ch of text) {
        const cp = ch.codePointAt(0);
        if (cp === undefined) continue;

        const fullWidth = normalizeToFullWidth(cp);
        const cell: Cell = {
          char: fullWidth,
          fg: context.currentFg,
          bg: context.currentBg,
        };

        this.compositionPreview.push({ x: cx, y: cy, cell });

        cx++;
        if (cx >= this.gridWidth) {
          cx = this.startX;
          cy++;
        }
      }

      context.requestPreviewUpdate();
    } else if (phase === "end") {
      this.compositionPreview = [];
      // 確定テキストは onTextInput で処理される
    }
  }

  onKeyDown(event: KeyboardEvent, context: ToolContext): boolean {
    if (!this.isActive) return false;

    if (event.key === "Escape") {
      this.commitSession(context);
      return true;
    }

    if (event.key === "Enter") {
      this.cursorX = this.startX;
      this.cursorY++;
      if (this.cursorY >= this.gridHeight) {
        this.cursorY = this.gridHeight - 1;
      }
      context.setCursorPos(this.cursorX, this.cursorY);
      return true;
    }

    if (event.key === "Backspace") {
      this.retreatCursor();
      // 現在位置をデフォルトセルに
      this.sessionUpdates.push({
        x: this.cursorX,
        y: this.cursorY,
        cell: { char: 0x3000, fg: context.currentFg, bg: context.currentBg },
      });
      context.setCursorPos(this.cursorX, this.cursorY);
      context.requestPreviewUpdate();
      return true;
    }

    return false;
  }

  onDeactivate(context: ToolContext): void {
    this.commitSession(context);
  }

  getPreview(): CellUpdate[] | null {
    const all = [...this.sessionUpdates, ...this.compositionPreview];
    return all.length > 0 ? all : null;
  }

  private advanceCursor(): void {
    this.cursorX++;
    if (this.cursorX >= this.gridWidth) {
      this.cursorX = this.startX;
      this.cursorY++;
      if (this.cursorY >= this.gridHeight) {
        this.cursorY = this.gridHeight - 1;
      }
    }
  }

  private retreatCursor(): void {
    this.cursorX--;
    if (this.cursorX < this.startX) {
      this.cursorX = this.gridWidth - 1;
      this.cursorY--;
      if (this.cursorY < 0) {
        this.cursorX = this.startX;
        this.cursorY = 0;
      }
    }
  }

  private commitSession(context: ToolContext): void {
    if (this.sessionUpdates.length > 0) {
      context.executeCommand(new PaintCellsCommand(this.sessionUpdates));
    }
    this.sessionUpdates = [];
    this.compositionPreview = [];
    this.isActive = false;
  }
}
