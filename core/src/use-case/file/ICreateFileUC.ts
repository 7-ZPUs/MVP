import type { File } from "../../entity/File";

export interface ICreateFileUC {
  execute(file: File): File;
}
