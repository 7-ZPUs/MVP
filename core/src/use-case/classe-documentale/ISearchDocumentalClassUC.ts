import { SearchResult } from '../../../../shared/domain/metadata';

export interface ISearchDocumentalClassUC {
    execute(name: string): Promise<SearchResult[]>;
}