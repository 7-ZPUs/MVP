import { inject, injectable } from 'tsyringe';
import { IExportFileUC } from '../IExportFileUC';
import { IFileRepository, FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import { ExportResult } from '../../../value-objects/ExportResult';

@injectable()
export class ExportFileUC implements IExportFileUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly fileRepo: IFileRepository
    ) {}

    async execute(fileId: number, targetPath: string): Promise<ExportResult> {
        const file = this.fileRepo.getById(fileId);
        if (!file) {
            return ExportResult.fail('NOT_FOUND', `File con id ${fileId} non trovato`);
        }
        return this.fileRepo.exportFile(file.getPath(), targetPath);
    }
}