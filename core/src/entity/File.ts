import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { FileDTO } from "../dto/FileDTO";

/** Forma della riga SQLite che il repository legge. */
export interface FileRow {
    id: number;
    filename: string;
    path: string;
    integrityStatus: string;
    isMain: number; // SQLite stores booleans as 0/1
    documentId: number;
}

export class File {
    /**
     * `null`  → entità non ancora persistita (prima dell'INSERT).
     * `number` → entità caricata dal DB o appena salvata.
     */
    private id: number | null = null;
    private readonly filename: string;
    private readonly path: string;
    private integrityStatus: IntegrityStatusEnum;
    private readonly isMain: boolean;
    /** Chiave esterna verso Documento — sempre obbligatoria. */
    private readonly documentId: number;

    /**
     * Costruttore usato per creare un nuovo file non ancora persistito.
     * L'id viene omesso: il DB lo assegnerà all'INSERT.
     */
    constructor(filename: string, path: string, isMain: boolean, documentId: number) {
        this.filename = filename;
        this.path = path;
        this.isMain = isMain;
        this.documentId = documentId;
        this.integrityStatus = IntegrityStatusEnum.UNKNOWN;
    }

    /**
     * Factory per ricostituire l'entità da una riga del DB.
     * Da usare esclusivamente nel repository.
     */
    static fromDB(row: FileRow): File {
        const file = new File(
            row.filename,
            row.path,
            row.isMain === 1,
            row.documentId
        );
        file.id = row.id;
        file.integrityStatus = row.integrityStatus as IntegrityStatusEnum;
        return file;
    }

    public getId(): number | null {
        return this.id;
    }

    public getFilename(): string {
        return this.filename;
    }

    public getPath(): string {
        return this.path;
    }

    public getIntegrityStatus(): IntegrityStatusEnum {
        return this.integrityStatus;
    }

    public setIntegrityStatus(status: IntegrityStatusEnum): void {
        this.integrityStatus = status;
    }

    public getIsMain(): boolean {
        return this.isMain;
    }

    public getDocumentId(): number {
        return this.documentId;
    }

    /**
     * Serializza l'entità in un plain object trasferibile via IPC.
     * Da chiamare SOLO nell'IPC adapter, mai nel dominio o nel repository.
     */
    public toDTO(): FileDTO {
        if (this.id === null) {
            throw new Error("Cannot convert to DTO: File entity is not yet persisted and has no ID.");
        }
        return {
            id: this.id,
            documentId: this.documentId,
            filename: this.filename,
            path: this.path,
            integrityStatus: this.integrityStatus,
            isMain: this.isMain,
        };
    }
}


