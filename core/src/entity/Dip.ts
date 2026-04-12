import { IntegrityStatusEnum } from "../value-objects/IntegrityStatusEnum";

export class Dip {
  private readonly id: number | null = null;
  private readonly uuid: string;
  private integrityStatus: IntegrityStatusEnum = IntegrityStatusEnum.UNKNOWN;

  constructor(uuid: string, integrityStatus: IntegrityStatusEnum = IntegrityStatusEnum.UNKNOWN, id: number | null = null) {
    this.uuid = uuid;
    this.integrityStatus = integrityStatus;
    this.id = id;
  }

  public getId(): number | null {
    return this.id;
  }

  public getUuid(): string {
    return this.uuid;
  }

  public getIntegrityStatus(): IntegrityStatusEnum {
    return this.integrityStatus;
  }

  public setIntegrityStatus(status: IntegrityStatusEnum): void {
    this.integrityStatus = status;
  }
}
