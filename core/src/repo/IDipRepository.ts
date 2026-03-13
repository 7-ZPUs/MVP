import { CreateDipDTO } from "../dto/DipDTO";
import { Dip } from "../entity/Dip";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export const DIP_REPOSITORY_TOKEN = Symbol('IDipRepository');

export interface IDipRepository {
    getById(id: number): Dip | null;
    getByUuid(uuid: string): Dip | null;
    save(dto: CreateDipDTO): Dip;
    getByStatus(status: IntegrityStatusEnum): Dip[];
    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void;
}