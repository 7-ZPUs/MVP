import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";
import { Metadata } from "../value-objects/Metadata";

export class Process {
  private readonly id: number | null = null;
  private readonly documentClassId: number | null = null;
  private readonly documentClassUuid: string;
  private readonly uuid: string;
  private integrityStatus: IntegrityStatusEnum;
  private readonly metadata: Metadata;

  constructor(
    documentClassUuid: string,
    uuid: string,
    metadata: Metadata,
    integrityStatus: IntegrityStatusEnum = IntegrityStatusEnum.UNKNOWN,
    id: number | null = null,
    documentClassId: number | null = null,
  ) {
    this.documentClassUuid = documentClassUuid;
    this.uuid = uuid;
    this.integrityStatus = integrityStatus;
    this.metadata = metadata;
    this.id = id;
    this.documentClassId = documentClassId;
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

  public getMetadata(): Metadata {
    return this.metadata;
  }

  public setIntegrityStatus(status: IntegrityStatusEnum): void {
    this.integrityStatus = status;
  }
}
