import { DocumentClass } from '../../entity/DocumentClass';

export interface ISearchDocumentalClassUC {
    execute(name: string): DocumentClass[];
}