import { Dip } from "../../entity/Dip";

export interface CreateDipInput {
    uuid: string;
}

export interface ICreateDipUC {
    execute(input: CreateDipInput): Dip;
}