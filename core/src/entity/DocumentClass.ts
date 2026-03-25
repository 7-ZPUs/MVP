import { DocumentClassDTO } from "../dto/DocumentClassDTO";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export interface DocumentClassRow {
    id: number;
    dipId: number;
    uuid: string;
    integrityStatus?: string;
    name: string;
    timestamp: string;
}

export class DocumentClass {
    private id: number | null = null;
    private dipId: number | null = null;
    private readonly dipUuid: string;
    private readonly uuid: string;
    private integrityStatus: IntegrityStatusEnum;
    private readonly name: string;
    private readonly timestamp: string;

    constructor(dipUuid: string, uuid: string, name: string, timestamp: string) {
        this.dipUuid = dipUuid;
        this.uuid = uuid;
        this.name = name;
        this.timestamp = timestamp;
        this.integrityStatus = IntegrityStatusEnum.UNKNOWN;
    }

    static fromDB(row: DocumentClassRow): DocumentClass {
        const docClass = new DocumentClass("", row.uuid, row.name, row.timestamp);
        docClass.id = row.id;
        docClass.dipId = row.dipId;
        docClass.integrityStatus = (row.integrityStatus as IntegrityStatusEnum) ?? IntegrityStatusEnum.UNKNOWN;
        return docClass;
    }

    public getId(): number | null {
        return this.id;
    }

    public getDipId(): number | null {
        return this.dipId;
    }

    public getDipUuid(): string {
        return this.dipUuid;
    }

    public getUuid(): string {
        return this.uuid;
    }

    public getName(): string {
        return this.name;
    }

    public getTimestamp(): string {
        return this.timestamp;
    }

    public getIntegrityStatus(): IntegrityStatusEnum {
        return this.integrityStatus;
    }

    public setIntegrityStatus(status: IntegrityStatusEnum): void {
        this.integrityStatus = status;
    }

    public toDTO(): DocumentClassDTO {
        if (this.id === null || this.dipId === null) {
            throw new Error("Cannot convert to DTO: DocumentClass entity is not yet persisted and has no ID.");
        }
        return {
            id: this.id,
            dipId: this.dipId,
            uuid: this.uuid,
            name: this.name,
            timestamp: this.timestamp,
            integrityStatus: this.integrityStatus
        };
    }
}   
