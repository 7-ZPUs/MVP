import { inject, injectable } from 'tsyringe';
import { ISearchProcessUC } from '../ISearchProcessUC';
import { IProcessRepository, PROCESS_REPOSITORY_TOKEN } from '../../../repo/IProcessRepository';
import { Process } from '../../../entity/Process';


@injectable()
export class SearchProcessUC implements ISearchProcessUC {
    constructor(
        @inject(PROCESS_REPOSITORY_TOKEN)
        private readonly repo: IProcessRepository
    ) {}

    execute(uuid: string): Process[] {
        const result = this.repo.searchProcesses(uuid);
        return result;
    }
}