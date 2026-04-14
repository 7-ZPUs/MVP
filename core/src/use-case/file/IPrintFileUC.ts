import { ExportResult } from '../../../../shared/domain/ExportResult';

export interface IPrintFileUC {
    execute(fileId: number): Promise<ExportResult>;
}