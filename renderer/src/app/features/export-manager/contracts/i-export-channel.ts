import { ExportResult }        from '../../../../../../shared/domain/ExportResult';
import { SaveDialogResponseDto } from '../domain/dtos';

export interface IExportChannel {
    exportFile(fileId: number, destPath: string): Promise<ExportResult>;
    openSaveDialog(defaultName?: string):         Promise<SaveDialogResponseDto>;
    printFile(fileId: number):    Promise<{ success: boolean; error?: string }>;
    printFiles(fileIds: number[]): Promise<{ canceled: boolean; results: { fileId: number; success: boolean; error?: string }[]; }>;
}