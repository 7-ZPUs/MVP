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
    private id: number | null;
    private documentClassId: number;
    private uuid: string;
    private integrityStatus: IntegrityStatusEnum;
    private metadata: Metadata[];

    constructor(documentClassId: number, uuid: string, metadata: Metadata[]) {
        this.id = null;
        this.documentClassId = documentClassId;
        this.uuid = uuid;
        this.integrityStatus = IntegrityStatusEnum.UNKNOWN;
        this.metadata = metadata;
    }

    static fromDB(row: ProcessRow, metadata: Metadata[]): Process {
        const process = new Process(row.documentClassId, row.uuid, metadata);
        process.id = row.id;
        process.integrityStatus = (row.integrityStatus as IntegrityStatusEnum) ?? IntegrityStatusEnum.UNKNOWN;
        return process;
    }

    public getId(): number | null {
        return this.id;
    }

    public getDocumentClassId(): number {
        return this.documentClassId;
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
        if (this.id === null) {
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