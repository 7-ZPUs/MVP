import { ExportFileResults } from '../../../../shared/domain/ExportFileResults';

export interface IExportFilesUC {
    execute( fileIds: number[], onProgress: (current: number, total: number) => void, ): Promise<ExportFileResults>;
}