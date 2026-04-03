import { ClasseDocumentaleDto, DipTreeNodeDto } from '../domain/dtos';
 
export interface IDipChannel {
  getClasses():                   Promise<ClasseDocumentaleDto[]>;
  loadChildren(nodeId: string):   Promise<DipTreeNodeDto[]>;
  downloadFile(nodeId: string):   Promise<Blob>;
}