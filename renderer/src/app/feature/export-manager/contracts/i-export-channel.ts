import { ExportResponseDto, ExportPdfResponseDto, SaveDialogResponseDto } from '../domain/dtos';
 
export interface IExportChannel {
  exportDocument(nodeId: string, destPath: string):        Promise<ExportResponseDto>;
  exportDocuments(nodeIds: string[], destPath: string):    Promise<ExportResponseDto>;
  printDocument(nodeId: string):                           Promise<ExportResponseDto>;
  printDocuments(nodeIds: string[]):                       Promise<ExportResponseDto>;
  openSaveDialog(defaultName?: string):                    Promise<SaveDialogResponseDto>;
}