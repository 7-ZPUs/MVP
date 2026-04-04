import { ExportResult } from '../../../../shared/domain/ExportResult';

export interface IExportFileUC {
    execute(fileId: number, targetPath: string): Promise<ExportResult>;
}