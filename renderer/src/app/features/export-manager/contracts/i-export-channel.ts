import { ExportResult } from '../../../../../../shared/domain/ExportResult';
import { SaveDialogResponseDto } from '../domain/dtos';
import { ExportFileResults } from '@shared/domain/ExportFileResults';

export interface IExportChannel {
    exportFile(fileId: number): Promise<ExportResult>;
    exportFiles( fileIds: number[], ): Promise<ExportFileResults>;
    printFile(fileId: number): Promise<ExportResult>;
    printFiles(fileIds: number[]): Promise<ExportFileResults>;
}