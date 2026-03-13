import { Dip } from "../../entity/Dip";

export interface IGetDipByIdUC {
    execute(id: number): Dip | null;
}