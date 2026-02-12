import type { Grid } from "../../domain/grid";

/** コマンドの基底インターフェース */
export interface Command {
  readonly description: string;
  execute(grid: Grid): Grid;
  undo(grid: Grid): Grid;
}
