import { inject, injectable } from 'tsyringe';
import { ISearchProcessUC } from '../ISearchProcessUC';
import { IProcessRepository, PROCESS_REPOSITORY_TOKEN } from '../../../repo/IProcessRepository';
import { SearchResult } from '../../../../../shared/domain/metadata';
import { Process } from '../../../entity/Process';


@injectable()
export class SearchProcessUC implements ISearchProcessUC {
    constructor(
        @inject(PROCESS_REPOSITORY_TOKEN)
        private readonly repo: IProcessRepository
    ) {}

    async execute(uuid: string): Promise<SearchResult[]> {
        const result = this.repo.searchProcesses(uuid);
        return result.map((process) => {
            const metadata = process.getMetadata();
            return {
                documentId: process.getId.toString(),
                name: metadata.findNodeByName('name')?.getStringValue() ?? '',
                type: metadata.findNodeByName('type')?.getStringValue() ?? '',
                score: null,
            };
        });
    }
}