import { DipDTO } from "../../dto/DipDTO";
import { Dip } from "../../entity/Dip";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";

export interface DipPersistenceRow {
  id: number;
  uuid: string;
  integrityStatus: string;
}

export interface DipPersistenceModel {
  uuid: string;
  integrityStatus: IntegrityStatusEnum;
}

export class DipMapper {
  static fromPersistence(row: DipPersistenceRow): Dip {
    return new Dip(
      row.uuid,
      IntegrityStatusEnum[
        row.integrityStatus as keyof typeof IntegrityStatusEnum
      ] || IntegrityStatusEnum.UNKNOWN,
      row.id,
    );
  }

  static toDTO(dip: Dip): DipDTO {
    const id = dip.getId();
    if (id === null) {
      throw new Error("Cannot convert Dip to DTO: id is null");
    }

    return {
      id,
      uuid: dip.getUuid(),
      integrityStatus: dip.getIntegrityStatus(),
    };
  }

  static toPersistence(dip: Dip): DipPersistenceModel {
    return {
      uuid: dip.getUuid(),
      integrityStatus: dip.getIntegrityStatus(),
    };
  }
}
