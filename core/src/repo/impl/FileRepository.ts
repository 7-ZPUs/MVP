import { inject, injectable } from "tsyringe";
import { File } from "../../entity/File";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import type { IFileRepository } from "../IFileRepository";
import { FileDAO } from "../../dao/FileDAO";
import { FILE_DAO_TOKEN } from "../../dao/IFileDAO";
import { ExportResult } from "../../value-objects/ExportResult";
import { PrintResult } from "../../value-objects/PrintResult";

@injectable()
export class FileRepository implements IFileRepository {
  constructor(
    @inject(FILE_DAO_TOKEN)
    private readonly dao: FileDAO,
  ) {}

  getById(id: number): File | null {
    return this.dao.getById(id);
  }

  getByDocumentId(documentId: number): File[] {
    return this.dao.getByDocumentId(documentId);
  }

  getByStatus(status: IntegrityStatusEnum): File[] {
    return this.dao.getByStatus(status);
  }

  save(file: File): File {
    return this.dao.save(file);
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
  }
  async exportFile(
    sourcePath: string,
    destPath: string,
  ): Promise<ExportResult> {
    try {
      await fs.promises.copyFile(sourcePath, destPath);
      return ExportResult.ok();
    } catch (err) {
      return ExportResult.fail(
        "WRITE_ERROR",
        err instanceof Error ? err.message : "Errore scrittura",
      );
    }
  }

  async printFile(sourcePath: string): Promise<PrintResult> {
    try {
      const { shell } = await import("electron");
      const error = await shell.openPath(sourcePath);
      if (error !== "") {
        return PrintResult.fail("SHELL_ERROR", error);
      }
      return PrintResult.ok();
    } catch (err) {
      return PrintResult.fail(
        "PRINT_ERROR",
        err instanceof Error ? err.message : "Errore stampa",
      );
    }
  }
}
