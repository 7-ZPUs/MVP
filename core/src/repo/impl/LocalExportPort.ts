import { injectable } from "tsyringe";
import { ExportResult } from "../../../../shared/domain/ExportResult";
import { IExportPort } from "../IExportPort";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

@injectable()
export class LocalExportPort implements IExportPort {
  async exportFile(
    stream: NodeJS.ReadableStream,
    destPath: string,
  ): Promise<ExportResult> {
    try {
      await pipeline(stream, createWriteStream(destPath));
      return ExportResult.ok();
    } catch (err) {
      return ExportResult.fail(
        "WRITE_ERROR",
        err instanceof Error ? err.message : "Errore scrittura",
      );
    }
  }
}
