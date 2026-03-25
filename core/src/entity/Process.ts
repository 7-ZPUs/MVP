import { ProcessDTO } from "../dto/ProcessDTO";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { Metadata } from "../value-objects/Metadata";

export interface ProcessRow {
    id: number;
    documentClassId: number;
    uuid: string;
    integrityStatus?: string;
}

export class Process {
    private id: number | null = null;
    private documentClassId: number | null = null;
    private readonly documentClassUuid: string;
    private readonly uuid: string;
    private integrityStatus: IntegrityStatusEnum;
    private readonly metadata: Metadata[];

    constructor(documentClassUuid: string, uuid: string, metadata: Metadata[]) {
        this.documentClassUuid = documentClassUuid;
        this.uuid = uuid;
        this.integrityStatus = IntegrityStatusEnum.UNKNOWN;
        this.metadata = metadata;
    }

    static fromDB(row: ProcessRow, metadata: Metadata[]): Process {
        const process = new Process("", row.uuid, metadata);
        process.id = row.id;
        process.documentClassId = row.documentClassId;
        process.integrityStatus = (row.integrityStatus as IntegrityStatusEnum) ?? IntegrityStatusEnum.UNKNOWN;
        return process;
    }

    public getId(): number | null {
        return this.id;
    }

    public getDocumentClassId(): number | null {
        return this.documentClassId;
    }

    public getDocumentClassUuid(): string {
        return this.documentClassUuid;
    }

    public getUuid(): string {
        return this.uuid;
    }

    public getIntegrityStatus(): IntegrityStatusEnum {
        return this.integrityStatus;
    }

    public getMetadata(): Metadata[] {
        return this.metadata;
    }

    public setIntegrityStatus(status: IntegrityStatusEnum): void {
        this.integrityStatus = status;
    }

    public toDTO(): ProcessDTO {
        if (this.id === null || this.documentClassId === null) {
            throw new Error("Cannot convert to DTO: Process entity is not yet persisted and has no ID.");
        }
        return {
            id: this.id,
            documentClassId: this.documentClassId,
            uuid: this.uuid,
            integrityStatus: this.integrityStatus,
            metadata: this.metadata.map((m) => m.toDTO()),
        };
    }
}