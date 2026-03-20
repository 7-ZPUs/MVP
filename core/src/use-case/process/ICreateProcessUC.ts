import type { Process } from "../../entity/Process";

export interface ICreateProcessUC {
  execute(process: Process): Process;
}
