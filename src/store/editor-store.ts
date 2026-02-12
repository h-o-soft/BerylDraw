import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { AnsiColor, PALETTES, type PaletteName, type PaletteData } from "../domain/cell";
import { createGrid, resizeGrid, type CellUpdate, type Grid } from "../domain/grid";
import type { BerylDocument } from "../domain/document";
import type { Position, Selection } from "../domain/position";
import { History } from "../application/history";
import type { Command } from "../application/commands/command";

export interface EditorState {
  // Document
  document: BerylDocument;

  // Tool
  activeTool: string;
  currentChar: number;
  currentFg: AnsiColor;
  currentBg: AnsiColor;
  fillMode: boolean;

  // Selection
  selection: Selection | null;
  clipboard: CellUpdate[] | null;

  // Cursor
  cursorPos: Position;

  // History
  history: History;

  // UI
  zoom: number;
  showGrid: boolean;
  previewCells: CellUpdate[] | null;
  paletteName: PaletteName;
  palette: PaletteData;

  // Actions
  setActiveTool: (toolName: string) => void;
  setCurrentChar: (char: number) => void;
  setCurrentFg: (color: AnsiColor) => void;
  setCurrentBg: (color: AnsiColor) => void;
  setFillMode: (fill: boolean) => void;
  setCursorPos: (pos: Position) => void;
  setSelection: (sel: Selection | null) => void;
  setClipboard: (cells: CellUpdate[] | null) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  setPreviewCells: (cells: CellUpdate[] | null) => void;
  setPalette: (name: PaletteName) => void;

  // Commands
  executeCommand: (command: Command) => void;
  undo: () => void;
  redo: () => void;

  // Document I/O
  newDocument: (width: number, height: number) => void;
  loadDocument: (doc: BerylDocument) => void;
  updateGrid: (grid: Grid) => void;
  resizeCanvas: (width: number, height: number) => void;
  markSaved: (filePath: string) => void;
}

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    document: {
      name: "Untitled",
      grid: createGrid(40, 25),
      filePath: null,
      dirty: false,
    },
    activeTool: "pen",
    currentChar: 0xff21, // 全角 A
    currentFg: AnsiColor.White,
    currentBg: AnsiColor.Black,
    fillMode: false,
    selection: null,
    clipboard: null,
    cursorPos: { x: 0, y: 0 },
    history: new History(100),
    zoom: 2,
    showGrid: true,
    previewCells: null,
    paletteName: "ansi" as PaletteName,
    palette: PALETTES.ansi,

    setActiveTool: (toolName) => set({ activeTool: toolName }),
    setCurrentChar: (char) => set({ currentChar: char }),
    setCurrentFg: (color) => set({ currentFg: color }),
    setCurrentBg: (color) => set({ currentBg: color }),
    setFillMode: (fill) => set({ fillMode: fill }),
    setCursorPos: (pos) => set({ cursorPos: pos }),
    setSelection: (sel) => set({ selection: sel }),
    setClipboard: (cells) => set({ clipboard: cells }),
    setZoom: (zoom) => set({ zoom: Math.max(1, Math.min(8, zoom)) }),
    toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
    setPreviewCells: (cells) => set({ previewCells: cells }),
    setPalette: (name) => set({ paletteName: name, palette: PALETTES[name] }),

    executeCommand: (command) => {
      const state = get();
      const newGrid = state.history.execute(command, state.document.grid);
      set({
        document: {
          ...state.document,
          grid: newGrid,
          dirty: true,
        },
        previewCells: null,
      });
    },

    undo: () => {
      const state = get();
      const newGrid = state.history.undo(state.document.grid);
      if (!newGrid) return;
      set({
        document: { ...state.document, grid: newGrid, dirty: true },
      });
    },

    redo: () => {
      const state = get();
      const newGrid = state.history.redo(state.document.grid);
      if (!newGrid) return;
      set({
        document: { ...state.document, grid: newGrid, dirty: true },
      });
    },

    newDocument: (width, height) =>
      set({
        document: {
          name: "Untitled",
          grid: createGrid(width, height),
          filePath: null,
          dirty: false,
        },
        history: new History(100),
        selection: null,
        clipboard: null,
        previewCells: null,
      }),

    loadDocument: (doc) =>
      set({
        document: doc,
        history: new History(100),
        selection: null,
        clipboard: null,
        previewCells: null,
      }),

    updateGrid: (grid) => {
      const state = get();
      set({
        document: { ...state.document, grid, dirty: true },
      });
    },

    resizeCanvas: (width, height) => {
      const state = get();
      const newGrid = resizeGrid(state.document.grid, width, height);
      set({
        document: { ...state.document, grid: newGrid, dirty: true },
        selection: null,
        previewCells: null,
      });
    },

    markSaved: (filePath) =>
      set((state) => {
        const name = filePath.split(/[/\\]/).pop()?.replace(/\.bdraw$/i, "") ?? state.document.name;
        return {
          document: { ...state.document, name, filePath, dirty: false },
        };
      }),
  })),
);
