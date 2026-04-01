import { ExportResult } from '../../value-objects/ExportResult';

export interface IExportFileUC {
    execute(fileId: number, targetPath: string): Promise<ExportResult>;
}