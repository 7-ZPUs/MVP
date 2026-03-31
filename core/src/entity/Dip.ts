import { DipDTO } from "../dto/DipDTO";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface DipRow {
    id: number;
    uuid: string;
    integrityStatus: string;
}

export class Dip {
    private id: number | null = null;
    private readonly uuid: string
    private integrityStatus: IntegrityStatusEnum;

    constructor(uuid: string) {
        this.uuid = uuid;
        this.integrityStatus = IntegrityStatusEnum.UNKNOWN;
    }

    static fromDB(row: DipRow): Dip {
        const dip = new Dip(row.uuid);
        dip.id = row.id;
        dip.integrityStatus = row.integrityStatus as IntegrityStatusEnum;
        return dip;
    }

    public getId(): number | null {
        return this.id;
    }

    public getUuid(): string {
        return this.uuid;
    }

    public getIntegrityStatus(): IntegrityStatusEnum {
        return this.integrityStatus;
    }

    public setIntegrityStatus(status: IntegrityStatusEnum): void {
        this.integrityStatus = status;
    }

    public toDTO(): DipDTO {
        if (this.id === null) {
            throw new Error("Cannot convert Dip to DTO: id is null");
        }
        return {
            id: this.id,
            dipId: this.id,
            uuid: this.uuid,
            integrityStatus: this.integrityStatus,
        };
    }
}