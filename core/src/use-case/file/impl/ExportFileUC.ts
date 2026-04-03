import { inject, injectable } from 'tsyringe';
import { IExportFileUC } from '../IExportFileUC';
import { IFileRepository, FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import { ExportResult } from '../../../../../shared/domain/ExportResult';
import { EXPORT_TOKEN, IExportPort } from '../../../repo/IExportPort';
import { IPackageReaderPort, PACKAGE_READER_PORT_TOKEN } from '../../../repo/IPackageReaderPort';

@injectable()
export class ExportFileUC implements IExportFileUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly fileRepo: IFileRepository,
        @inject(EXPORT_TOKEN)
        private readonly exportPort: IExportPort,
        @inject(PACKAGE_READER_PORT_TOKEN)
        private readonly packageReader: IPackageReaderPort
    ) {}

    async execute(fileId: number, targetPath: string): Promise<ExportResult> {
        const file = this.fileRepo.getById(fileId);
        if (!file) {
            return ExportResult.fail('NOT_FOUND', `File con id ${fileId} non trovato`);
        }
        return this.exportPort.exportFile(await this.packageReader.readFileBytes(file.getPath()), targetPath);
    }
}