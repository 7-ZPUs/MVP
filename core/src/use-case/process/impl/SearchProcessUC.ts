import { inject, injectable } from 'tsyringe';
import { ISearchProcessUC } from '../ISearchProcessUC';
import { IProcessRepository } from '../../../repo/IProcessRepository';
import { Process } from '../../../entity/Process';

@injectable()
export class SearchProcessService implements ISearchProcessUC {
    constructor(
        @inject('IProcessRepository')
        private readonly repo: IProcessRepository
    ) {}

    execute(uuid: string): Process[] {
        return this.repo.searchProcesses(uuid);
    }
}