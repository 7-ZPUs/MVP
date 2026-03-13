import { CreateDipDTO } from "../../dto/DipDTO";
import { Dip } from "../../entity/Dip";

export interface ICreateDipUC {
    execute(dto: CreateDipDTO): Dip;
}