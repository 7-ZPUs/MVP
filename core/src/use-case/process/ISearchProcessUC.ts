import { SearchResult } from '../../../../shared/domain/metadata';

export interface ISearchProcessUC {
    execute(uuid: string): Promise<SearchResult[]>;
}