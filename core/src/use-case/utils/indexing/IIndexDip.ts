import { IndexResult } from "./IndexResult";

export const INDEX_DIP_TOKEN = Symbol("IIndexDip");

export interface IIndexDip {
  execute(dipPath: string): Promise<IndexResult>;
}
