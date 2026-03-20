import { inject, injectable } from 'tsyringe';
import { Process } from '../../../entity/Process';
import type { IProcessRepository } from '../../../repo/IProcessRepository';
import { PROCESS_REPOSITORY_TOKEN } from '../../../repo/IProcessRepository';
import type { CreateProcessInput, ICreateProcessUC } from '../ICreateProcessUC';
import { Metadata } from '../../../value-objects/Metadata';

@injectable()
export class CreateProcessUC implements ICreateProcessUC {
  constructor(
    @inject(PROCESS_REPOSITORY_TOKEN)
    private readonly repo: IProcessRepository,
  ) {}

    execute(input: CreateProcessInput): Process {
        const metadata = input.metadata.map((m) => new Metadata(m.name, m.value, m.type));
        const process = new Process(input.documentClassId, input.uuid, metadata);
        return this.repo.save(process);
    }
}
