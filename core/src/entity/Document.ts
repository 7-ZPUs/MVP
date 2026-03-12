import { Metadata } from "../value-objects/Metadata";
import { DocumentDTO } from "../dto/DocumentDTO";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

/** Forma della riga SQLite che il repository legge. */
export interface DocumentRow {
    id: number;
    uuid: string;
    integrityStatus?: string;
    processId: number;
}

export class Document {
    /**
     * `null`  → entità non ancora persistita (prima dell'INSERT).
     * `number` → entità caricata dal DB o appena salvata.
     */
    private id: number | null;
    private uuid: string;
    private metadata: Metadata[];
    private integrityStatus: IntegrityStatusEnum;
    private processId: number;

    /**
     * Costruttore usato per creare una nuova entità non ancora persistita.
     * L'id viene omesso: il DB lo assegnerà all'INSERT.
     */
    constructor(uuid: string, metadata: Metadata[], processId: number) {
        this.id = null;
        this.uuid = uuid;
        this.metadata = metadata;
        this.integrityStatus = IntegrityStatusEnum.UNKNOWN;
        this.processId = processId;
    }

    /**
     * Factory per ricostituire l'entità da una riga del DB.
     * Da usare esclusivamente nel repository.
     */
    static fromDB(row: DocumentRow, metadata: Metadata[]): Document {
        const doc = new Document(row.uuid, metadata, row.processId);
        doc.id = row.id;
        doc.integrityStatus = (row.integrityStatus as IntegrityStatusEnum) ?? IntegrityStatusEnum.UNKNOWN;
        return doc;
    }

    public getId(): number | null {
        return this.id;
    }

    public getUuid(): string {
        return this.uuid;
    }

    public getMetadata(): Metadata[] {
        return this.metadata;
    }

    public getIntegrityStatus(): IntegrityStatusEnum {
        return this.integrityStatus;
    }

    public setIntegrityStatus(status: IntegrityStatusEnum): void {
        this.integrityStatus = status;
    }

    public getProcessId(): number {
        return this.processId;
    }

    /**
     * Serializza l'entità in un plain object trasferibile via IPC.
     * Da chiamare SOLO nell'IPC adapter, mai nel dominio o nel repository.
     */
    public toDTO(): DocumentDTO {
        return {
            id: this.id,
            uuid: this.uuid,
            integrityStatus: this.integrityStatus,
            metadata: this.metadata.map((m) => m.toDTO()),
            processId: this.processId,
        };
    }
}


