import { CreateDocumentDTO } from '../../dto/DocumentDTO';
import type { Document } from '../../entity/Document';

export interface ICreateDocumentUC {
    execute(dto: CreateDocumentDTO): Document;
}
