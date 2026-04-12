import { Process } from "../../entity/Process";

export interface IGetProcessByIdUC {
    execute(id: number): Process | null;
}