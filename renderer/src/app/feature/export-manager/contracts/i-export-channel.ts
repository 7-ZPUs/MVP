import { ExportResult }        from '../../../../../../shared/domain/ExportResult';
import { SaveDialogResponseDto } from '../domain/dtos';

export interface IExportChannel {
    exportFile(fileId: number, destPath: string): Promise<ExportResult>;
    openSaveDialog(defaultName?: string):         Promise<SaveDialogResponseDto>;
}