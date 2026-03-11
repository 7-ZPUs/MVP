import { Metadata } from "../value-objects/Metadata";
import { DocumentoDTO } from "../dto/DocumentoDTO";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

/** Forma della riga SQLite che il repository legge. */
export interface DocumentoRow {
    id: number;
    uuid: string;
    integrityStatus?: string;
}

export class Documento {
    /**
     * `null`  → entità non ancora persistita (prima dell'INSERT).
     * `number` → entità caricata dal DB o appena salvata.
     */
    private id: number | null;
    private uuid: string;
    private metadata: Metadata[];
    private integrityStatus: IntegrityStatusEnum;

    /**
     * Costruttore usato per creare una nuova entità non ancora persistita.
     * L'id viene omesso: il DB lo assegnerà all'INSERT.
     */
    constructor(uuid: string, metadata: Metadata[]) {
        this.id = null;
        this.uuid = uuid;
        this.metadata = metadata;
        this.integrityStatus = IntegrityStatusEnum.UNKNOWN;
    }

    /**
     * Factory per ricostituire l'entità da una riga del DB.
     * Da usare esclusivamente nel repository.
     */
    static fromDB(row: DocumentoRow, metadata: Metadata[]): Documento {
        const doc = new Documento(row.uuid, metadata);
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

    /**
     * Serializza l'entità in un plain object trasferibile via IPC.
     * Da chiamare SOLO nell'IPC adapter, mai nel dominio o nel repository.
     */
    public toDTO(): DocumentoDTO {
        return {
            id: this.id,
            uuid: this.uuid,
            integrityStatus: this.integrityStatus,
            metadata: this.metadata.map((m) => m.toDTO()),
        };
    }
}


