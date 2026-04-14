import { ExportResult } from '../../../../shared/domain/ExportResult';

export interface IExportFileUC {
  execute(fileId: number): Promise<ExportResult>;
}