import { Metadata } from "../value-objects/Metadata";
import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export class Document {
  /**
   * `null`  → entità non ancora persistita (prima dell'INSERT).
   * `number` → entità caricata dal DB o appena salvata.
   */
  private id: number | null = null;
  private readonly uuid: string;
  private readonly metadata: Metadata;
  private integrityStatus: IntegrityStatusEnum;
  private readonly processId: number | null = null;
  private readonly processUuid: string;

  /**
   * Costruttore usato per creare una nuova entità non ancora persistita.
   * L'id viene omesso: il DB lo assegnerà all'INSERT.
   */
  constructor(uuid: string, metadata: Metadata, processUuid: string, integrityStatus: IntegrityStatusEnum = IntegrityStatusEnum.UNKNOWN, id: number | null = null, processId: number | null = null) {
    this.uuid = uuid;
    this.metadata = metadata;
    this.integrityStatus = integrityStatus;
    this.processUuid = processUuid;
    this.id = id;
    this.processId = processId;
  }

  public getId(): number | null {
    return this.id;
  }

  public setId(id: number): void {
    this.id = id;
  }

  public getUuid(): string {
    return this.uuid;
  }

  public getMetadata(): Metadata {
    return this.metadata;
  }

  public getIntegrityStatus(): IntegrityStatusEnum {
    return this.integrityStatus;
  }

  public setIntegrityStatus(status: IntegrityStatusEnum): void {
    this.integrityStatus = status;
  }

  public getProcessId(): number | null {
    return this.processId;
  }

  public getProcessUuid(): string {
    return this.processUuid;
  }
}
