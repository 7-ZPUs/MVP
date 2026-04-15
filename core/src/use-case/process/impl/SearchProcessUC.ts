import { inject, injectable } from "tsyringe";
import { ISearchProcessUC } from "../ISearchProcessUC";
import {
  ISearchProcessesPort,
  PROCESS_SEARCH_PORT_TOKEN,
} from "../../../repo/IProcessRepository";
import { Process } from "../../../entity/Process";

@injectable()
export class SearchProcessUC implements ISearchProcessUC {
  constructor(
    @inject(PROCESS_SEARCH_PORT_TOKEN)
    private readonly repo: ISearchProcessesPort,
  ) {}

  execute(uuid: string): Process[] {
    const result = this.repo.searchProcesses(uuid);
    return result;
  }
}
