import type { Grid } from "../domain/grid";
import type { Command } from "./commands/command";

/** Undo/Redo履歴管理 */
export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  execute(command: Command, grid: Grid): Grid {
    const newGrid = command.execute(grid);
    this.undoStack.push(command);
    this.redoStack = [];

    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }

    return newGrid;
  }

  undo(grid: Grid): Grid | null {
    const command = this.undoStack.pop();
    if (!command) return null;

    const newGrid = command.undo(grid);
    this.redoStack.push(command);
    return newGrid;
  }

  redo(grid: Grid): Grid | null {
    const command = this.redoStack.pop();
    if (!command) return null;

    const newGrid = command.execute(grid);
    this.undoStack.push(command);
    return newGrid;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
