import { ExportResult } from "../../../shared/domain/ExportResult";

export const EXPORT_TOKEN = Symbol("IExportPort");

export interface IExportPort {
  exportFile(stream: NodeJS.ReadableStream, destPath: string): Promise<ExportResult>;
}
