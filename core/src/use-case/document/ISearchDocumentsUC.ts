import { SearchFilter } from '../../value-objects/SearchFilter';
import { Document } from '../../entity/Document';

export interface ISearchDocumentsUC {
    execute(filters: SearchFilter[]): Document[];
}