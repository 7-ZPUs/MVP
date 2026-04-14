import { ExportFileResults } from '../../value-objects/ExportFileResults';

export interface IExportFilesUC {
    execute( fileIds: number[], onProgress: (current: number, total: number) => void, ): Promise<ExportFileResults>;
}