import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { FileDTO } from "../dto/FileDTO";

/** Forma della riga SQLite che il repository legge. */
export interface FileRow {
  id: number;
  filename: string;
  path: string;
  hash: string;
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
  private readonly uuid: string;
  private readonly filename: string;
  private readonly path: string;
  private readonly hash: string;
  private integrityStatus: IntegrityStatusEnum;
  private readonly isMain: boolean;
  /** Chiave esterna verso Documento — populated by DB only. */
  private documentId: number | null = null;
  private readonly documentUuid: string;

  /**
   * Costruttore usato per creare un nuovo file non ancora persistito.
   * L'id viene omesso: il DB lo assegnerà all'INSERT.
   */
  constructor(
    filename: string,
    path: string,
    hash: string,
    isMain: boolean,
    uuid: string,
    documentUuid: string,
  ) {
    this.filename = filename;
    this.path = path;
    this.hash = hash;
    this.isMain = isMain;
    this.uuid = uuid;
    this.documentUuid = documentUuid;
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
      row.hash,
      row.isMain === 1,
      "",
      "",
    );
    file.id = row.id;
    file.documentId = row.documentId;
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

  public getHash(): string {
    return this.hash;
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

  public getDocumentId(): number | null {
    return this.documentId;
  }

  public getUuid(): string {
    return this.uuid;
  }

  public getDocumentUuid(): string {
    return this.documentUuid;
  }

  /**
   * Serializza l'entità in un plain object trasferibile via IPC.
   * Da chiamare SOLO nell'IPC adapter, mai nel dominio o nel repository.
   */
  public toDTO(): FileDTO {
    if (this.id === null || this.documentId === null) {
      throw new Error(
        "Cannot convert to DTO: File entity is not yet persisted and has no ID.",
      );
    }
    return {
      id: this.id,
      documentId: this.documentId,
      filename: this.filename,
      path: this.path,
      hash: this.hash,
      integrityStatus: this.integrityStatus,
      isMain: this.isMain,
    };
  }
}
