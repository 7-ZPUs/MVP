import { CreateProcessDTO } from '../../dto/ProcessDTO';
import type { Process } from '../../entity/Process';

export interface ICreateProcessUC {
    execute(dto: CreateProcessDTO): Process;
}
