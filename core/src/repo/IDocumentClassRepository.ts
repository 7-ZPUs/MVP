import { CreateDocumentClassDTO } from "../dto/DocumentClassDTO";
import { DocumentClass } from "../entity/DocumentClass";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DOCUMENT_CLASS_REPOSITORY_TOKEN = Symbol('IDocumentClassRepository');

export interface IDocumentClassRepository {
    getById(id: number): DocumentClass | null;
    getByDipId(dipId: number): DocumentClass[];
    getByStatus(status: IntegrityStatusEnum): DocumentClass[];
    save(dto: CreateDocumentClassDTO): DocumentClass;
    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
    searchDocumentalClasses(name: string): DocumentClass[];
}