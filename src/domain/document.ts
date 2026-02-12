import { Grid } from "./grid";

/** BerylDrawドキュメント */
export interface BerylDocument {
  readonly name: string;
  readonly grid: Grid;
  readonly filePath: string | null;
  readonly dirty: boolean;
}
