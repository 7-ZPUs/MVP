import { Document } from "../../entity/Document";
import { SearchDocumentsQuery } from "../../entity/search/SearchQuery.model";

export interface ISearchDocumentsUC {
    execute(filters: SearchDocumentsQuery): Promise<Document[]>;
}