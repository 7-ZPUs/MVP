import { ExportResult } from '../../../../shared/domain/ExportResult';

export interface ExportFilesResult {
  canceled: boolean;
  results: { fileId: number; success: boolean; error?: string }[];
}

export interface IExportFilesUC {
    execute( fileIds: number[], onProgress: (current: number, total: number) => void, ): Promise<ExportFilesResult>;
}