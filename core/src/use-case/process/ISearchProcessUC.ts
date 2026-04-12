import { Process } from '../../entity/Process';

export interface ISearchProcessUC {
    execute(uuid: string): Process[];
}