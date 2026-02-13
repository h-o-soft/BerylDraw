import { useRef, useEffect, useCallback, useState } from "react";
import { useEditorStore } from "../../store/editor-store";
import { MisakiSpriteSheet } from "../../rendering/sprite-sheet";
import { ColoredSpriteCache } from "../../rendering/colored-sprite-cache";
import { CanvasRenderer } from "../../rendering/canvas-renderer";
import { PenTool } from "../../application/tools/pen-tool";
import { ColorPenTool } from "../../application/tools/color-pen-tool";
import { TextTool } from "../../application/tools/text-tool";
import { RectangleTool } from "../../application/tools/rectangle-tool";
import { EllipseTool } from "../../application/tools/ellipse-tool";
import { FillTool } from "../../application/tools/fill-tool";
import { EyedropperTool } from "../../application/tools/eyedropper-tool";
import { SelectTool } from "../../application/tools/select-tool";
import { EraserTool } from "../../application/tools/eraser-tool";
import { PaintCellsCommand } from "../../application/commands/paint-cells-command";
import type { Tool, ToolContext, ToolEvent } from "../../application/tools/tool";
import {
  saveDocument,
  openDocument,
} from "../../infrastructure/tauri-file-io";
import misakiGothicPng from "../../assets/fonts/misaki_gothic.png";

// ツールレジストリ
const tools: Record<string, Tool> = {
  pen: new PenTool(),
  colorpen: new ColorPenTool(),
  text: new TextTool(),
  rectangle: new RectangleTool(),
  ellipse: new EllipseTool(),
  fill: new FillTool(),
  eyedropper: new EyedropperTool(),
  select: new SelectTool(),
  eraser: new EraserTool(),
};

export function MainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const spriteSheetRef = useRef<MisakiSpriteSheet>(new MisakiSpriteSheet());
  const colorCacheRef = useRef<ColoredSpriteCache>(new ColoredSpriteCache());
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);

  const document = useEditorStore((s) => s.document);
  const activeTool = useEditorStore((s) => s.activeTool);
  const fillMode = useEditorStore((s) => s.fillMode);
  const zoom = useEditorStore((s) => s.zoom);
  const showGrid = useEditorStore((s) => s.showGrid);
  const cursorPos = useEditorStore((s) => s.cursorPos);
  const selection = useEditorStore((s) => s.selection);
  const previewCells = useEditorStore((s) => s.previewCells);
  const palette = useEditorStore((s) => s.palette);

  // FillModeをツールに同期
  useEffect(() => {
    const rectTool = tools["rectangle"] as RectangleTool;
    const ellTool = tools["ellipse"] as EllipseTool;
    if (rectTool) rectTool.filled = fillMode;
    if (ellTool) ellTool.filled = fillMode;
  }, [fillMode]);

  // フォント読み込み
  useEffect(() => {
    const spriteSheet = spriteSheetRef.current;
    spriteSheet.load(misakiGothicPng).then(() => {
      const img = new Image();
      img.onload = () => {
        sourceImageRef.current = img;
        const currentPalette = useEditorStore.getState().palette;
        colorCacheRef.current.generate(spriteSheet, img, currentPalette);
        setFontLoaded(true);
      };
      img.src = misakiGothicPng;
    });
  }, []);

  // パレット変更時にスプライトキャッシュ再生成 + 強制再描画
  useEffect(() => {
    if (!fontLoaded) return;
    colorCacheRef.current.regenerate(palette);
    const renderer = rendererRef.current;
    if (renderer) {
      renderer.palette = palette;
      renderer.forceRedraw(useEditorStore.getState().document.grid);
    }
  }, [palette, fontLoaded]);

  // レンダラー初期化
  useEffect(() => {
    if (!fontLoaded || !canvasRef.current) return;
    rendererRef.current = new CanvasRenderer(
      canvasRef.current,
      spriteSheetRef.current,
      colorCacheRef.current,
    );
    if (overlayCanvasRef.current) {
      rendererRef.current.setOverlayCanvas(overlayCanvasRef.current);
    }
    rendererRef.current.scale = zoom;
  }, [fontLoaded, zoom]);

  // 描画
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.scale = zoom;
    renderer.palette = palette;
    renderer.render(document.grid);

    // オーバーレイは毎フレーム全クリアしてから描画
    renderer.clearOverlay();
    // プレビューセル（ドラッグ中のペン描画、矩形/円のプレビュー等）
    if (previewCells && previewCells.length > 0) {
      renderer.renderPreviewCells(previewCells, document.grid);
    }
    if (showGrid) {
      renderer.renderGridLines(document.grid);
    }
    if (selection) {
      renderer.renderSelection(selection, document.grid);
    }
    renderer.renderCursor(cursorPos, document.grid);
  }, [fontLoaded, document.grid, zoom, showGrid, cursorPos, selection, previewCells, palette]);

  // テキストツール用: hidden textarea にフォーカス
  useEffect(() => {
    const tool = tools[activeTool];
    if (tool?.needsTextInput && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [activeTool]);

  // ツールコンテキスト生成
  const getToolContext = useCallback((): ToolContext => {
    const state = useEditorStore.getState();
    return {
      grid: state.document.grid,
      currentChar: state.currentChar,
      currentFg: state.currentFg,
      currentBg: state.currentBg,
      executeCommand: (cmd) => useEditorStore.getState().executeCommand(cmd),
      setCurrentChar: (char) => useEditorStore.getState().setCurrentChar(char),
      setCurrentFg: (color) => useEditorStore.getState().setCurrentFg(color),
      setCurrentBg: (color) => useEditorStore.getState().setCurrentBg(color),
      setCursorPos: (x, y) =>
        useEditorStore.getState().setCursorPos({ x, y }),
      setSelection: (sel) =>
        useEditorStore.getState().setSelection(sel),
      requestPreviewUpdate: () => {
        const tool = tools[useEditorStore.getState().activeTool];
        if (tool) {
          useEditorStore
            .getState()
            .setPreviewCells(tool.getPreview());
        }
      },
    };
  }, []);

  // スクリーン座標からToolEventを生成 (グリッド範囲にクランプ)
  const makeToolEventFromScreen = useCallback(
    (clientX: number, clientY: number, e: { shiftKey: boolean; ctrlKey?: boolean; metaKey?: boolean; button: number }): ToolEvent | null => {
      const renderer = rendererRef.current;
      const canvas = overlayCanvasRef.current;
      if (!renderer || !canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const pos = renderer.screenToCell(
        clientX - rect.left,
        clientY - rect.top,
      );

      // グリッド範囲にクランプ
      const grid = useEditorStore.getState().document.grid;
      const cellX = Math.max(0, Math.min(grid.width - 1, pos.x));
      const cellY = Math.max(0, Math.min(grid.height - 1, pos.y));

      return {
        cellX,
        cellY,
        shift: e.shiftKey,
        ctrl: (e.ctrlKey || e.metaKey) ?? false,
        button: e.button,
      };
    },
    [],
  );

  // ドラッグ中のwindowレベルイベントハンドラ
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.MouseEvent) => {
      const tool = tools[activeTool];
      const event = makeToolEventFromScreen(e.clientX, e.clientY, e);
      if (!tool || !event) return;

      useEditorStore
        .getState()
        .setCursorPos({ x: event.cellX, y: event.cellY });

      tool.onPointerDown(event, getToolContext());
      isDraggingRef.current = true;

      // テキストツールはhidden inputにフォーカス
      if (tool.needsTextInput && hiddenInputRef.current) {
        hiddenInputRef.current.focus();
      }

      e.preventDefault();
    },
    [activeTool, makeToolEventFromScreen, getToolContext],
  );

  // キャンバス上のホバー (ドラッグ中でない時のカーソル更新)
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current) return; // ドラッグ中はwindowハンドラに任せる
      const event = makeToolEventFromScreen(e.clientX, e.clientY, e);
      if (!event) return;
      useEditorStore
        .getState()
        .setCursorPos({ x: event.cellX, y: event.cellY });
    },
    [makeToolEventFromScreen],
  );

  // windowレベルのmousemove/mouseup (ドラッグ中)
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const state = useEditorStore.getState();
      const tool = tools[state.activeTool];
      const event = makeToolEventFromScreen(e.clientX, e.clientY, e);
      if (!tool || !event) return;

      state.setCursorPos({ x: event.cellX, y: event.cellY });
      tool.onPointerMove(event, getToolContext());
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const state = useEditorStore.getState();
      const tool = tools[state.activeTool];
      const event = makeToolEventFromScreen(e.clientX, e.clientY, e);
      if (!tool || !event) return;

      tool.onPointerUp(event, getToolContext());
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [makeToolEventFromScreen, getToolContext]);

  // Hidden textarea: テキスト入力
  const handleTextInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const tool = tools[activeTool];
      if (!tool?.onTextInput) return;

      const textarea = e.currentTarget;
      const text = textarea.value;
      if (text) {
        tool.onTextInput(text, getToolContext());
        textarea.value = "";
      }
    },
    [activeTool, getToolContext],
  );

  const handleCompositionStart = useCallback(() => {
    const tool = tools[activeTool];
    if (!tool?.onComposition) return;
    tool.onComposition("", "start", getToolContext());
  }, [activeTool, getToolContext]);

  const handleCompositionUpdate = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      const tool = tools[activeTool];
      if (!tool?.onComposition) return;
      tool.onComposition(e.data, "update", getToolContext());
    },
    [activeTool, getToolContext],
  );

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLTextAreaElement>) => {
      const tool = tools[activeTool];
      if (!tool?.onComposition) return;
      tool.onComposition(e.data, "end", getToolContext());
    },
    [activeTool, getToolContext],
  );

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // 通常のinput/selectにフォーカスがある場合はショートカットを全て無効化
      // (テキストツール用の非表示textareaは除外: ツールのキーハンドラが処理する)
      const isRegularInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLTextAreaElement &&
          target !== hiddenInputRef.current);
      if (isRegularInput) return;

      const state = useEditorStore.getState();

      // テキストツール用hidden textareaにフォーカスがある場合:
      // Ctrl/Meta付きのショートカット(Undo/Redo等)は有効、
      // それ以外はツールのonKeyDownに委ねる
      const isHiddenTextarea =
        target instanceof HTMLTextAreaElement &&
        target === hiddenInputRef.current;

      // Ctrl+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveDocument(state.document).then((filePath) => {
          if (filePath) state.markSaved(filePath);
        }).catch((err) => console.error("Failed to save:", err));
        return;
      }
      // Ctrl+O: Open
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        openDocument().then((result) => {
          if (result) state.loadDocument(result.doc);
        }).catch((err) => console.error("Failed to open:", err));
        return;
      }
      // Ctrl+N: New
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        // MenuBarのダイアログを開くため、カスタムイベントを発行
        window.dispatchEvent(new CustomEvent("beryldraw:new-document"));
        return;
      }
      // Ctrl+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        state.undo();
        return;
      }
      // Ctrl+Shift+Z or Ctrl+Y: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        state.redo();
        return;
      }
      // Ctrl+A: Select All
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        const grid = state.document.grid;
        state.setSelection({
          start: { x: 0, y: 0 },
          end: { x: grid.width - 1, y: grid.height - 1 },
        });
        state.setActiveTool("select");
        return;
      }
      // Ctrl+C: Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        const sel = state.selection;
        if (sel) {
          const copied = SelectTool.copySelection(
            state.document.grid,
            sel,
          );
          state.setClipboard(copied);
        }
        return;
      }
      // Ctrl+X: Cut
      if ((e.ctrlKey || e.metaKey) && e.key === "x") {
        e.preventDefault();
        const sel = state.selection;
        if (sel) {
          const copied = SelectTool.copySelection(
            state.document.grid,
            sel,
          );
          state.setClipboard(copied);
          const deletes = SelectTool.deleteSelection(sel);
          state.executeCommand(new PaintCellsCommand(deletes));
          state.setSelection(null);
        }
        return;
      }
      // Ctrl+V: Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        const clip = state.clipboard;
        if (clip) {
          const updates = SelectTool.pasteClipboard(
            clip,
            state.cursorPos.x,
            state.cursorPos.y,
          );
          state.executeCommand(new PaintCellsCommand(updates));
        }
        return;
      }

      // hidden textarea にフォーカスがある場合、修飾キーなしの操作は
      // ツールのonKeyDownだけに委ねる (ツールショートカット等は無効化)
      if (isHiddenTextarea) {
        const tool = tools[state.activeTool];
        if (tool?.onKeyDown) {
          const ctx = getToolContext();
          if (tool.onKeyDown(e, ctx)) {
            e.preventDefault();
          }
        }
        return;
      }

      // Delete: 選択範囲を削除
      if (e.key === "Delete" || e.key === "Backspace") {
        const sel = state.selection;
        if (sel && state.activeTool === "select") {
          const updates = SelectTool.deleteSelection(sel);
          state.executeCommand(new PaintCellsCommand(updates));
          state.setSelection(null);
          e.preventDefault();
          return;
        }
      }

      // ツールのキーハンドラ
      const tool = tools[state.activeTool];
      if (tool?.onKeyDown) {
        const ctx = getToolContext();
        if (tool.onKeyDown(e, ctx)) {
          e.preventDefault();
          return;
        }
      }

      // ツールショートカット (Ctrl/Meta が押されていない時のみ)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toUpperCase();
        for (const t of Object.values(tools)) {
          if (t.shortcut === key && t.name !== state.activeTool) {
            state.setActiveTool(t.name);
            e.preventDefault();
            return;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [getToolContext]);

  if (!fontLoaded) {
    return <div style={{ color: "#666", padding: 20 }}>Loading font...</div>;
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* セルコンテンツ用キャンバス (差分更新) */}
      <canvas
        ref={canvasRef}
        style={{ imageRendering: "pixelated", display: "block" }}
      />
      {/* オーバーレイ用キャンバス (グリッド線・カーソル・選択、毎フレーム全クリア) */}
      <canvas
        ref={overlayCanvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handleCanvasMouseMove}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          cursor: "crosshair",
          imageRendering: "pixelated",
        }}
      />
      {/* テキストツール用の非表示textarea */}
      <textarea
        ref={hiddenInputRef}
        onInput={handleTextInput}
        onCompositionStart={handleCompositionStart}
        onCompositionUpdate={handleCompositionUpdate}
        onCompositionEnd={handleCompositionEnd}
        style={{
          position: "absolute",
          left: -9999,
          top: -9999,
          width: 1,
          height: 1,
          opacity: 0,
        }}
      />
    </div>
  );
}
