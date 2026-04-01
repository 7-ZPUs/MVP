import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export class File {
  /**
   * `null`  → entità non ancora persistita (prima dell'INSERT).
   * `number` → entità caricata dal DB o appena salvata.
   */
  private readonly id: number | null = null;
  private readonly uuid: string;
  private readonly filename: string;
  private readonly path: string;
  private readonly hash: string;
  private integrityStatus: IntegrityStatusEnum;
  private readonly isMain: boolean;
  /** Chiave esterna verso Documento — populated by DB only. */
  private readonly documentId: number | null = null;
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
    integrityStatus: IntegrityStatusEnum = IntegrityStatusEnum.UNKNOWN,
    id: number | null = null,
    documentId: number | null = null
  ) {
    this.filename = filename;
    this.path = path;
    this.hash = hash;
    this.isMain = isMain;
    this.uuid = uuid;
    this.documentUuid = documentUuid;
    this.integrityStatus = integrityStatus;
    this.id = id;
    this.documentId = documentId;
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
}
