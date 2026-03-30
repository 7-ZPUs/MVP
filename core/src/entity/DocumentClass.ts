import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export class DocumentClass {
  private readonly id: number | null = null;
  private readonly dipId: number | null = null;
  private readonly dipUuid: string;
  private readonly uuid: string;
  private integrityStatus: IntegrityStatusEnum;
  private readonly name: string;
  private readonly timestamp: string;

  constructor(dipUuid: string, uuid: string, name: string, timestamp: string, integrityStatus: IntegrityStatusEnum = IntegrityStatusEnum.UNKNOWN, id: number | null = null, dipId: number | null = null) {
    this.dipUuid = dipUuid;
    this.uuid = uuid;
    this.name = name;
    this.timestamp = timestamp;
    this.integrityStatus = integrityStatus;
    this.id = id;
    this.dipId = dipId;
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
}
